namespace EnglishApp.Api.DTOs.Errors;

public sealed record LearnerErrorDto(
    long Id,
    byte SkillId,
    string SkillCode,
    string SkillNameVi,
    string Detail,
    string? Correction,
    bool IsResolved,
    DateTime CreatedAt,
    string Source,
    long? ReferenceId);

public sealed record ResolveErrorRequest(bool IsResolved = true);

public sealed record ErrorGroupDto(string SkillCode, string SkillNameVi, int Count, int Unresolved);

public sealed record ErrorSummaryDto(
    int Total,
    int Unresolved,
    IReadOnlyList<ErrorGroupDto> Groups,
    IReadOnlyList<LearnerErrorDto> Recent);
