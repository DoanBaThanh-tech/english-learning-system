using System.ComponentModel.DataAnnotations;
using EnglishApp.Api.DTOs.Vocabulary;

namespace EnglishApp.Api.DTOs.Study;

public sealed record StartSessionRequest(
    [RegularExpression("learn|review")] string Mode = "learn",
    [Range(1, 50)] int Limit = 20,
    string? ExerciseTypeCode = null);

public sealed record StudySessionDto(
    long Id,
    string Mode,
    DateTime StartedAt,
    DateTime? EndedAt,
    int Answered,
    int Correct);

public sealed record StudyCardDto(
    int UserWordId,
    int SenseId,
    int WordId,
    string Lemma,
    string? Phonetic,
    string? AudioUrl,
    string DefinitionEn,
    string MeaningVi,
    string PartOfSpeech,
    string? LevelCode,
    string? ContextSentence,
    string ExerciseTypeCode,
    string ExerciseTypeName,
    IReadOnlyList<string> Options,
    SrsDto? Srs,
    string Status);

public sealed record SubmitAnswerRequest(
    [Range(1, int.MaxValue)] int UserWordId,
    [Required] string ExerciseTypeCode,
    [MaxLength(1000)] string? UserAnswer,
    int? ResponseMs = null,
    int? Quality = null);

public sealed record AnswerResultDto(
    bool IsCorrect,
    string CorrectAnswer,
    int Quality,
    DateTime DueAt,
    int IntervalDays,
    int Repetitions,
    string Message);

public sealed record StudySessionSummaryDto(
    long Id,
    string Mode,
    DateTime StartedAt,
    DateTime? EndedAt,
    int Minutes,
    int Answered,
    int Correct,
    double AccuracyPct,
    IReadOnlyList<int> LearnedUserWordIds);
