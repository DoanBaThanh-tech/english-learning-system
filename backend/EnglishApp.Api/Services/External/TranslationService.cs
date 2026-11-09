using System.Net;
using System.Text.Json;
using EnglishApp.Api.Common.Options;
using EnglishApp.Api.Common.Utilities;
using Microsoft.Extensions.Caching.Memory;

namespace EnglishApp.Api.Services.External;

/// <summary>
/// Dịch miễn phí theo thứ tự: MyMemory -> Google gtx -> null.
/// Kết quả được cache 24h trong bộ nhớ để tránh gọi lặp và giữ hạn mức.
/// </summary>
public sealed class TranslationService : ITranslationService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IMemoryCache _cache;
    private readonly ExternalApiOptions _options;
    private readonly ILogger<TranslationService> _logger;

    public TranslationService(
        IHttpClientFactory httpClientFactory,
        IMemoryCache cache,
        ExternalApiOptions options,
        ILogger<TranslationService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _cache = cache;
        _options = options;
        _logger = logger;
    }

    public async Task<TranslationResult?> TranslateAsync(string text, string from = "en", string to = "vi", CancellationToken ct = default)
    {
        if (!_options.EnableTranslation || string.IsNullOrWhiteSpace(text))
        {
            return null;
        }

        var source = TextUtil.Truncate(text.Trim(), 4000);
        var cacheKey = $"tr:{from}:{to}:{TextUtil.HashToken(source)}";

        if (_cache.TryGetValue(cacheKey, out TranslationResult? cached) && cached is not null)
        {
            return cached with { FromCache = true };
        }

        var result = await TryMyMemoryAsync(source, from, to, ct)
                     ?? await TryGoogleAsync(source, from, to, ct);

        if (result is not null)
        {
            _cache.Set(cacheKey, result, TimeSpan.FromHours(24));
        }

        return result;
    }

    private async Task<TranslationResult?> TryMyMemoryAsync(string text, string from, string to, CancellationToken ct)
    {
        try
        {
            var client = _httpClientFactory.CreateClient("translate");
            var url = $"get?q={Uri.EscapeDataString(text)}&langpair={Uri.EscapeDataString(from)}|{Uri.EscapeDataString(to)}";
            using var response = await client.GetAsync(url, ct);
            if (!response.IsSuccessStatusCode) return null;

            await using var stream = await response.Content.ReadAsStreamAsync(ct);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: ct);
            var root = document.RootElement;

            if (root.TryGetProperty("responseStatus", out var status) && status.GetInt32() != 200)
            {
                return null;
            }

            if (!root.TryGetProperty("responseData", out var data) ||
                !data.TryGetProperty("translatedText", out var translated))
            {
                return null;
            }

            var value = WebUtility.HtmlDecode(translated.GetString() ?? string.Empty).Trim();
            if (string.IsNullOrWhiteSpace(value) ||
                value.Contains("MYMEMORY WARNING", StringComparison.OrdinalIgnoreCase) ||
                value.Contains("QUERY LENGTH LIMIT", StringComparison.OrdinalIgnoreCase))
            {
                return null;
            }

            return new TranslationResult(value, "mymemory", false);
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            _logger.LogWarning("MyMemory timeout");
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "MyMemory failed");
            return null;
        }
    }

    private async Task<TranslationResult?> TryGoogleAsync(string text, string from, string to, CancellationToken ct)
    {
        try
        {
            var client = _httpClientFactory.CreateClient("translate-google");
            var url = $"translate_a/single?client=gtx&sl={Uri.EscapeDataString(from)}&tl={Uri.EscapeDataString(to)}&dt=t&q={Uri.EscapeDataString(text)}";
            using var response = await client.GetAsync(url, ct);
            if (!response.IsSuccessStatusCode) return null;

            await using var stream = await response.Content.ReadAsStreamAsync(ct);
            using var document = await JsonDocument.ParseAsync(stream, cancellationToken: ct);
            var root = document.RootElement;

            if (root.ValueKind != JsonValueKind.Array || root.GetArrayLength() == 0) return null;

            var parts = new List<string>();
            foreach (var segment in root[0].EnumerateArray())
            {
                if (segment.ValueKind == JsonValueKind.Array && segment.GetArrayLength() > 0)
                {
                    var piece = segment[0].GetString();
                    if (!string.IsNullOrWhiteSpace(piece)) parts.Add(piece);
                }
            }

            var value = string.Concat(parts).Trim();
            return string.IsNullOrWhiteSpace(value) ? null : new TranslationResult(value, "google", false);
        }
        catch (OperationCanceledException) when (!ct.IsCancellationRequested)
        {
            _logger.LogWarning("Google translate timeout");
            return null;
        }
        catch (Exception ex)
        {
            _logger.LogDebug(ex, "Google translate failed");
            return null;
        }
    }
}
