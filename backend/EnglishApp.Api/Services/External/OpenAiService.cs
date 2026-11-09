using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using EnglishApp.Api.Common.Options;

namespace EnglishApp.Api.Services.External;

/// <summary>
/// Client tương thích OpenAI Chat Completions. Mặc định trỏ tới Gemini free tier
/// (https://generativelanguage.googleapis.com/v1beta/openai/) nhưng có thể đổi
/// BaseUrl sang Groq/OpenRouter/LLM nội bộ mà không sửa code.
/// </summary>
public sealed class OpenAiService : IAiService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly AiOptions _options;
    private readonly ILogger<OpenAiService> _logger;

    public OpenAiService(
        IHttpClientFactory httpClientFactory,
        AiOptions options,
        ILogger<OpenAiService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _options = options;
        _logger = logger;
    }

    public bool IsEnabled =>
        _options.Enabled &&
        !string.IsNullOrWhiteSpace(_options.ApiKey) &&
        !string.IsNullOrWhiteSpace(_options.BaseUrl);

    public async Task<AiChatCompletion?> ChatAsync(
        string systemPrompt,
        IReadOnlyList<AiTurn> history,
        string userMessage,
        CancellationToken ct = default)
    {
        if (!IsEnabled) return null;

        var messages = new List<object> { new { role = "system", content = systemPrompt } };
        messages.AddRange(history.Select(h => new { role = h.Role, content = h.Content }));
        messages.Add(new { role = "user", content = userMessage });

        messages.Insert(1, new
        {
            role = "system",
            content = "Always answer with a single JSON object: " +
                      "{\"reply\":\"...\",\"corrected\":\"...\",\"corrections\":[{\"original\":\"...\",\"correction\":\"...\",\"explanation\":\"...\"}]}. " +
                      "No markdown fences. Keep reply friendly and under 120 words."
        });

        var content = await CompleteAsync(messages, 0.6, ct);
        if (content is null) return null;

        var json = ExtractJson(content);
        if (json is null) return new AiChatCompletion(content.Trim(), null, Array.Empty<AiCorrection>());

        try
        {
            using var document = JsonDocument.Parse(json);
            var root = document.RootElement;
            var reply = root.TryGetProperty("reply", out var r) ? r.GetString() : null;
            var corrected = root.TryGetProperty("corrected", out var c) ? c.GetString() : null;
            var corrections = new List<AiCorrection>();

            if (root.TryGetProperty("corrections", out var array) && array.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in array.EnumerateArray().Take(8))
                {
                    var original = item.TryGetProperty("original", out var o) ? o.GetString() : null;
                    var correction = item.TryGetProperty("correction", out var cor) ? cor.GetString() : null;
                    var explanation = item.TryGetProperty("explanation", out var ex) ? ex.GetString() : null;
                    if (!string.IsNullOrWhiteSpace(original) && !string.IsNullOrWhiteSpace(correction))
                    {
                        corrections.Add(new AiCorrection(original!, correction!, explanation ?? string.Empty));
                    }
                }
            }

            return new AiChatCompletion(
                string.IsNullOrWhiteSpace(reply) ? content.Trim() : reply!,
                string.IsNullOrWhiteSpace(corrected) ? null : corrected,
                corrections);
        }
        catch (JsonException)
        {
            return new AiChatCompletion(content.Trim(), null, Array.Empty<AiCorrection>());
        }
    }

    public async Task<AiContextTranslation?> TranslateInContextAsync(
        string word,
        string sentence,
        IReadOnlyList<string> definitions,
        CancellationToken ct = default)
    {
        if (!IsEnabled || definitions.Count == 0) return null;

        var numbered = string.Join("\n", definitions.Select((d, i) => $"{i}: {d}"));
        var messages = new List<object>
        {
            new
            {
                role = "system",
                content = "You are a bilingual lexicographer. Choose the English sense that best matches the sentence, " +
                          "then give a concise Vietnamese meaning for the word IN THAT CONTEXT. " +
                          "Return only JSON: {\"chosenIndex\":0,\"meaningVi\":\"...\",\"confidence\":0-100,\"explanation\":\"...\"}."
            },
            new
            {
                role = "user",
                content = $"Word: {word}\nSentence: {sentence}\nSenses:\n{numbered}"
            }
        };

        var content = await CompleteAsync(messages, 0.1, ct);
        if (content is null) return null;

        var json = ExtractJson(content);
        if (json is null) return null;

        try
        {
            using var document = JsonDocument.Parse(json);
            var root = document.RootElement;
            var meaning = root.TryGetProperty("meaningVi", out var m) ? m.GetString() : null;
            var index = root.TryGetProperty("chosenIndex", out var i) ? i.GetInt32() : 0;
            var confidence = root.TryGetProperty("confidence", out var c) ? c.GetDouble() : 80;
            var explanation = root.TryGetProperty("explanation", out var e) ? e.GetString() : null;

            if (string.IsNullOrWhiteSpace(meaning)) return null;

            return new AiContextTranslation(
                meaning!,
                Math.Clamp(index, 0, definitions.Count - 1),
                Math.Clamp(confidence, 0, 100),
                explanation);
        }
        catch (Exception ex) when (ex is JsonException or InvalidOperationException or FormatException)
        {
            return null;
        }
    }

    private async Task<string?> CompleteAsync(IReadOnlyList<object> messages, double temperature, CancellationToken ct)
    {
        try
        {
            var client = _httpClientFactory.CreateClient("ai");
            var baseUrl = _options.BaseUrl.TrimEnd('/');
            var url = $"{baseUrl}/chat/completions";

            using var request = new HttpRequestMessage(HttpMethod.Post, url);
            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);
            request.Content = new StringContent(JsonSerializer.Serialize(new
            {
                model = _options.Model,
                messages,
                temperature,
                max_tokens = 900
            }), Encoding.UTF8, "application/json");

            using var response = await client.SendAsync(request, ct);
            var body = await response.Content.ReadAsStringAsync(ct);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("AI provider returned {Status}: {Body}", response.StatusCode,
                    body.Length > 300 ? body[..300] : body);
                return null;
            }

            using var document = JsonDocument.Parse(body);
            var root = document.RootElement;
            if (!root.TryGetProperty("choices", out var choices) || choices.GetArrayLength() == 0) return null;

            var message = choices[0].GetProperty("message");
            return message.TryGetProperty("content", out var content) ? content.GetString() : null;
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            _logger.LogWarning("AI provider timeout");
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "AI provider failed, falling back to offline tutor");
            return null;
        }
    }

    private static string? ExtractJson(string content)
    {
        var trimmed = content.Trim();
        if (trimmed.StartsWith("```", StringComparison.Ordinal))
        {
            var firstNewline = trimmed.IndexOf('\n');
            if (firstNewline >= 0) trimmed = trimmed[(firstNewline + 1)..];
            if (trimmed.EndsWith("```", StringComparison.Ordinal)) trimmed = trimmed[..^3];
        }

        var start = trimmed.IndexOf('{');
        var end = trimmed.LastIndexOf('}');
        return start >= 0 && end > start ? trimmed[start..(end + 1)] : null;
    }
}
