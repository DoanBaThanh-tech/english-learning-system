using EnglishApp.Api.DTOs.Users;

namespace EnglishApp.Api.DTOs.Stats;

public sealed record StatsOverviewDto(
    int TotalWords,
    int MasteredWords,
    int LearningWords,
    int DueCount,
    int StreakDays,
    int TotalStudyMinutes,
    int TotalAnswers,
    double AccuracyPct,
    TodayStatsDto Today,
    IReadOnlyList<DailyStatDto> Last14Days,
    IReadOnlyList<SkillScoreDto> Skills);

public sealed record HeatmapDayDto(DateOnly Date, int Answers, int Minutes, int Level);

public sealed record HeatmapDto(int Days, int MaxAnswers, IReadOnlyList<HeatmapDayDto> Data);

public sealed record SkillRadarDto(
    IReadOnlyList<SkillScoreDto> Skills,
    DateTime MeasuredAt,
    string StrongestSkill,
    string WeakestSkill);
