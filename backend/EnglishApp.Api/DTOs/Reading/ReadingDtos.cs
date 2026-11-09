using System.ComponentModel.DataAnnotations;

namespace EnglishApp.Api.DTOs.Reading;

public sealed record PassageSummaryDto(
    int Id,
    string Title,
    string? Topic,
    byte LevelId,
    string LevelCode,
    string LevelName,
    int WordCount,
    int ProgressPct,
    DateTime? LastReadAt,
    int? SourceId);

public sealed record PassageDetailDto(
    int Id,
    string Title,
    string? Topic,
    byte LevelId,
    string LevelCode,
    string LevelName,
    string Body,
    int WordCount,
    int ProgressPct,
    DateTime? LastReadAt,
    int? SourceId);

public sealed record CreatePassageRequest(
    [Required, MaxLength(300)] string Title,
    [Required] string Body,
    [Range(1, 6)] byte LevelId,
    [MaxLength(100)] string? Topic = null,
    int? SourceId = null);

public sealed record UpdatePassageRequest(
    [Required, MaxLength(300)] string Title,
    [Required] string Body,
    [Range(1, 6)] byte LevelId,
    [MaxLength(100)] string? Topic = null,
    int? SourceId = null);

public sealed record UpdateProgressRequest([Range(0, 100)] byte ProgressPct);

public sealed record LensSegmentDto(
    string Text,
    bool IsWord,
    int? WordId,
    int? UserWordId,
    string? MeaningVi);

public sealed record PassageLensDto(
    int PassageId,
    string Title,
    IReadOnlyList<LensSegmentDto> Segments,
    int SavedWordCount);
