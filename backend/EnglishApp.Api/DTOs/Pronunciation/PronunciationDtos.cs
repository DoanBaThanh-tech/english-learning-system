using System.ComponentModel.DataAnnotations;

namespace EnglishApp.Api.DTOs.Pronunciation;

public sealed record AnalyzePronunciationRequest(
    int? WordId,
    [Required, MaxLength(500)] string ReferenceText,
    [Required, MaxLength(1000)] string Transcript,
    [MaxLength(500)] string? AudioUrl = null);

public sealed record PhonemeScoreDto(string Phoneme, byte Score, string? Feedback);

public sealed record SpeechWordDto(string Word, string Spoken, bool Correct);

public sealed record PronunciationAttemptDto(
    long Id,
    string ReferenceText,
    int? WordId,
    string? Lemma,
    byte OverallScore,
    string? AudioUrl,
    DateTime CreatedAt,
    IReadOnlyList<PhonemeScoreDto> Phonemes,
    IReadOnlyList<SpeechWordDto> Words,
    IReadOnlyList<string> Tips);

public sealed record PronunciationSummaryDto(
    int Attempts,
    double AverageScore,
    byte BestScore,
    DateTime? LastPracticedAt,
    IReadOnlyList<string> FocusTips);
