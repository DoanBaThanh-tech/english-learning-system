using System.ComponentModel.DataAnnotations;

namespace EnglishApp.Api.DTOs.Vocabulary;

public sealed record FolderDto(int Id, string Name, int WordCount);
public sealed record CreateFolderRequest([Required, MaxLength(100)] string Name);
public sealed record UpdateFolderRequest([Required, MaxLength(100)] string Name);

public sealed record TagDto(int Id, string Name, int WordCount);
public sealed record CreateTagRequest([Required, MaxLength(50)] string Name);
public sealed record UpdateTagRequest([Required, MaxLength(50)] string Name);

public sealed record SrsDto(
    DateTime DueAt,
    int IntervalDays,
    int Repetitions,
    decimal EaseFactor,
    bool IsDue);

public sealed record UserWordDto(
    int Id,
    int SenseId,
    int WordId,
    string Lemma,
    string? Phonetic,
    string? AudioUrl,
    string MeaningVi,
    string DefinitionEn,
    string PartOfSpeech,
    string? LevelCode,
    string? ContextSentence,
    string? Note,
    string Status,
    int? FolderId,
    string? FolderName,
    IReadOnlyList<TagDto> Tags,
    SrsDto? Srs,
    DateTime AddedAt);

public sealed record AddUserWordRequest(
    [Range(1, int.MaxValue)] int SenseId,
    int? FolderId = null,
    int? SourceId = null,
    [MaxLength(1000)] string? ContextSentence = null,
    [MaxLength(500)] string? Note = null,
    IReadOnlyList<int>? TagIds = null);

public sealed record AddWordByLemmaRequest(
    [Required, MaxLength(100)] string Lemma,
    [MaxLength(1000)] string? ContextSentence = null,
    int? FolderId = null,
    [MaxLength(500)] string? Note = null,
    IReadOnlyList<int>? TagIds = null);

public sealed record UpdateUserWordRequest(
    int? FolderId,
    [MaxLength(500)] string? Note,
    [RegularExpression("new|learning|mastered")] string? Status,
    IReadOnlyList<int>? TagIds);

public sealed record VocabularyStatsDto(
    int Total,
    int New,
    int Learning,
    int Mastered,
    int Due,
    int Folders,
    int Tags);
