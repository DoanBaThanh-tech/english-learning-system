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
    [Required(ErrorMessage = "Tên gọi là thông tin bắt buộc.")]
    [StringLength(30, MinimumLength = 2,
        ErrorMessage = "Tên gọi chỉ được chứa chữ cái và khoảng trắng, tối đa 30 ký tự.")]
    [RegularExpression(@"^[\p{L}\p{M}]+(?: [\p{L}\p{M}]+)*$",
        ErrorMessage = "Tên gọi chỉ được chứa chữ cái và khoảng trắng, không có số hoặc ký tự đặc biệt.")]
    string DisplayName,
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
