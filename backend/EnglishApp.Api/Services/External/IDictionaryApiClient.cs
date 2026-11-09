namespace EnglishApp.Api.Services.External;

public sealed record ExternalDefinition(
    string Definition,
    string? Example,
    IReadOnlyList<string> Synonyms,
    IReadOnlyList<string> Antonyms);

public sealed record ExternalMeaning(
    string PartOfSpeech,
    IReadOnlyList<ExternalDefinition> Definitions);

public sealed record ExternalPhonetic(string? Text, string? Audio);

public sealed record ExternalEntry(
    string Word,
    IReadOnlyList<ExternalPhonetic> Phonetics,
    IReadOnlyList<ExternalMeaning> Meanings);

public interface IDictionaryApiClient
{
    Task<ExternalEntry?> FetchAsync(string lemma, CancellationToken ct = default);
}
