using System.ComponentModel.DataAnnotations;

namespace EnglishApp.Api.DTOs.Dictionary;

public sealed record ExampleDto(string SentenceEn, string? SentenceVi);

public sealed record SenseDto(
    int Id,
    string PartOfSpeech,
    string PartOfSpeechVi,
    string? LevelCode,
    string DefinitionEn,
    string MeaningVi,
    bool IsVerified,
    IReadOnlyList<ExampleDto> Examples);

public sealed record PronunciationDto(string Accent, string Ipa, string? AudioUrl);

public sealed record WordDto(
    int Id,
    string Lemma,
    string? PhoneticUs,
    string? PhoneticUk,
    string? AudioUs,
    string? AudioUk,
    IReadOnlyList<SenseDto> Senses,
    bool Saved,
    int? UserWordId);

public sealed record WordSearchItemDto(
    int Id,
    string Lemma,
    string? Phonetic,
    string Meaning,
    string PartOfSpeech,
    string? LevelCode);

public sealed record ContextLookupRequest(
    [Required, MaxLength(100)] string Word,
    [Required, MaxLength(1000)] string Sentence,
    byte? LevelId = null,
    bool TranslateSentence = true);

public sealed record SenseAlternativeDto(
    int SenseId,
    string PartOfSpeech,
    string DefinitionEn,
    string MeaningVi,
    double Confidence);

public sealed record ContextLookupResult(
    string Word,
    string Lemma,
    int? WordId,
    int? ChosenSenseId,
    string MeaningVi,
    string DefinitionEn,
    string PartOfSpeech,
    string? Phonetic,
    double Confidence,
    string Source,
    bool FromCache,
    string? SentenceTranslation,
    IReadOnlyList<SenseAlternativeDto> Alternatives);

public sealed record TranslateRequest(
    [Required, MaxLength(4000)] string Text,
    string? From = "en",
    string? To = "vi");

public sealed record TranslateResponse(
    string SourceText,
    string TranslatedText,
    string Provider,
    bool FromCache);

public sealed record WordOfTheDayDto(
    DateTime Date,
    WordDto Word,
    string ContextSentence,
    string ContextMeaning);
