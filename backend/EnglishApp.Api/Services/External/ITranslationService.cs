namespace EnglishApp.Api.Services.External;

public sealed record TranslationResult(string Text, string Provider, bool FromCache);

public interface ITranslationService
{
    Task<TranslationResult?> TranslateAsync(string text, string from = "en", string to = "vi", CancellationToken ct = default);
}
