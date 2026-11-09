using System.ComponentModel.DataAnnotations;

namespace EnglishApp.Api.DTOs.Users;

public sealed record UserProfileDto(
    int Id,
    string Email,
    string DisplayName,
    string? AvatarUrl,
    byte? CurrentLevelId,
    string? LevelCode,
    string? LevelName,
    short DailyWordGoal,
    string TimeZoneId,
    DateTime CreatedAt);

public sealed record UpdateProfileRequest(
    [Required, MaxLength(100)] string DisplayName,
    [MaxLength(500)] string? AvatarUrl,
    byte? CurrentLevelId,
    [Range(1, 500)] short? DailyWordGoal,
    [MaxLength(64)] string? TimeZoneId);

public sealed record TodayStatsDto(
    short WordsLearned,
    short WordsReviewed,
    short MinutesStudied,
    short DailyGoal,
    bool GoalMet);

public sealed record DailyStatDto(
    DateOnly Date,
    int WordsLearned,
    int WordsReviewed,
    int MinutesStudied,
    bool GoalMet);

public sealed record SkillScoreDto(
    byte SkillId,
    string Code,
    string NameVi,
    decimal Score,
    DateTime MeasuredAt);

public sealed record ActivePlanTaskDto(
    int PlanId,
    int TaskId,
    string Title,
    DateOnly DueDate,
    string SkillCode,
    string SkillNameVi);

public sealed record DashboardDto(
    UserProfileDto User,
    int StreakDays,
    TodayStatsDto Today,
    int DueCount,
    int TotalWords,
    int MasteredWords,
    IReadOnlyList<DailyStatDto> Weekly,
    IReadOnlyList<SkillScoreDto> Skills,
    ActivePlanTaskDto? NextTask);
