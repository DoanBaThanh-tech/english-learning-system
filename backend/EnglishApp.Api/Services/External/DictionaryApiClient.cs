using System.Net;
using System.Text.Json;
using EnglishApp.Api.Common.Options;
using EnglishApp.Api.Common.Utilities;

namespace EnglishApp.Api.Services.External;

/// <summary>
/// Free Dictionary API (api.dictionaryapi.dev) – miễn phí, không cần key.
/// Chỉ lấy phần định nghĩa/phiên âm/audio; nghĩa tiếng Việt do TranslationService xử lý.
/// </summary>
public sealed class DictionaryApiClient : IDictionaryApiClient
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ExternalApiOptions _options;
    private readonly ILogger<DictionaryApiClient> _logger;

    public DictionaryApiClient(
        IHttpClientFactory httpClientFactory,
        ExternalApiOptions options,
        ILogger<DictionaryApiClient> logger)
    {
        _httpClientFactory = httpClientFactory;
        _options = options;
        _logger = logger;
    }

    public async Task<ExternalEntry?> FetchAsync(string lemma, CancellationToken ct = default)
    {
        if (!_options.EnableDictionary)
        {
            return null;
        }

        var word = TextUtil.Normalize(lemma);
        if (word.Length == 0)
        {
            return null;
        }

        try
        {
            var client = _httpClientFactory.CreateClient("dictionary");
            var url = $"api/v2/entries/en/{Uri.EscapeDataString(word)}";
            using var response = await client.GetAsync(url, ct);

            if (response.StatusCode == HttpStatusCode.NotFound)
            {
                return null;
            }

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Dictionary API returned {Status} for {Word}", response.StatusCode, word);
                return null;
            }

            await using var stream = await response.Content.ReadAsStreamAsync(ct);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: ct);

            if (document.RootElement.ValueKind != JsonValueKind.Array || document.RootElement.GetArrayLength() == 0)
            {
                return null;
            }

            var first = document.RootElement[0];
            var resolvedWord = first.TryGetProperty("word", out var w) ? w.GetString() ?? word : word;

            var phonetics = new List<ExternalPhonetic>();
            if (first.TryGetProperty("phonetics", out var ph) && ph.ValueKind == JsonValueKind.Array)
            {
                foreach (var item in ph.EnumerateArray())
                {
                    var text = item.TryGetProperty("text", out var t) ? t.GetString() : null;
                    var audio = item.TryGetProperty("audio", out var a) ? a.GetString() : null;
                    if (!string.IsNullOrWhiteSpace(text) || !string.IsNullOrWhiteSpace(audio))
                    {
                        phonetics.Add(new ExternalPhonetic(text, string.IsNullOrWhiteSpace(audio) ? null : audio));
                    }
                }
            }

            var meanings = new List<ExternalMeaning>();
            if (first.TryGetProperty("meanings", out var meaningArray) && meaningArray.ValueKind == JsonValueKind.Array)
            {
                foreach (var meaning in meaningArray.EnumerateArray().Take(8))
                {
                    var pos = meaning.TryGetProperty("partOfSpeech", out var p) ? p.GetString() ?? "phrase" : "phrase";
                    var definitions = new List<ExternalDefinition>();

                    if (meaning.TryGetProperty("definitions", out var defs) && defs.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var def in defs.EnumerateArray().Take(5))
                        {
                            var definition = def.TryGetProperty("definition", out var d) ? d.GetString() : null;
                            if (string.IsNullOrWhiteSpace(definition)) continue;

                            var example = def.TryGetProperty("example", out var e) ? e.GetString() : null;
                            var synonyms = ReadStringArray(def, "synonyms");
                            var antonyms = ReadStringArray(def, "antonyms");
                            definitions.Add(new ExternalDefinition(definition!, example, synonyms, antonyms));
                        }
                    }

                    if (definitions.Count > 0)
                    {
                        meanings.Add(new ExternalMeaning(pos, definitions));
                    }
                }
            }

            return meanings.Count == 0 ? null : new ExternalEntry(resolvedWord, phonetics, meanings);
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            _logger.LogWarning("Dictionary API timeout for {Word}", word);
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Dictionary API failed for {Word}", word);
            return null;
        }
    }

    private static IReadOnlyList<string> ReadStringArray(JsonElement element, string propertyName)
    {
        if (!element.TryGetProperty(propertyName, out var array) || array.ValueKind != JsonValueKind.Array)
        {
            return Array.Empty<string>();
        }

        return array.EnumerateArray()
            .Select(x => x.GetString())
            .Where(x => !string.IsNullOrWhiteSpace(x))
            .Take(8)
            .Select(x => x!)
            .ToList();
    }
}
