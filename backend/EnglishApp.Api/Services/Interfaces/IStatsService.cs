using EnglishApp.Api.DTOs.Stats;
using EnglishApp.Api.DTOs.Users;

namespace EnglishApp.Api.Services.Interfaces;

public interface IStatsService
{
    Task<DashboardDto> GetDashboardAsync(int userId, CancellationToken ct = default);
    Task<StatsOverviewDto> GetOverviewAsync(int userId, CancellationToken ct = default);
    Task<IReadOnlyList<DailyStatDto>> GetDailyAsync(int userId, DateOnly from, DateOnly to, CancellationToken ct = default);
    Task<HeatmapDto> GetHeatmapAsync(int userId, int days, CancellationToken ct = default);
    Task<SkillRadarDto> GetSkillsAsync(int userId, CancellationToken ct = default);
    Task<IReadOnlyList<SkillScoreDto>> RecalculateSkillsAsync(int userId, CancellationToken ct = default);
    Task<int> GetStreakAsync(int userId, CancellationToken ct = default);
}
