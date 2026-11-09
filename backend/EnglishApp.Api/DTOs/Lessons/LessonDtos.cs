using System.ComponentModel.DataAnnotations;
using EnglishApp.Api.DTOs.Dictionary;

namespace EnglishApp.Api.DTOs.Lessons;

public sealed record SourceDto(
    int Id,
    string SourceType,
    string Title,
    string? Url,
    int ContentLength,
    DateTime CreatedAt,
    int LessonCount);

public sealed record CreateSourceRequest(
    [Required, RegularExpression("web|text|video|document")] string SourceType,
    [Required, MaxLength(300)] string Title,
    [MaxLength(1000)] string? Url = null,
    string? Content = null,
    bool FetchContentFromUrl = true);

public sealed record UpdateSourceRequest(
    [Required, MaxLength(300)] string Title,
    [MaxLength(1000)] string? Url,
    string? Content);

public sealed record GenerateLessonRequest(
    [Range(3, 50)] int TargetWords = 15,
    byte? LevelId = null,
    bool SaveToNotebook = false,
    bool EnrichUnknown = true);

public sealed record LessonSummaryDto(
    int Id,
    string Title,
    int? SourceId,
    string? SourceTitle,
    byte? LevelId,
    string? LevelCode,
    int ItemCount,
    DateTime CreatedAt);

public sealed record LessonItemDto(
    int SenseId,
    string Lemma,
    string? Phonetic,
    string MeaningVi,
    string DefinitionEn,
    string PartOfSpeech,
    string? ContextSentence,
    int Order,
    bool Saved,
    int? UserWordId);

public sealed record LessonDetailDto(
    int Id,
    string Title,
    int? SourceId,
    string? SourceTitle,
    byte? LevelId,
    string? LevelCode,
    DateTime CreatedAt,
    IReadOnlyList<LessonItemDto> Items);
