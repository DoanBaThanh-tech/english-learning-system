using EnglishApp.Api.Common.Auth;
using EnglishApp.Api.DTOs.Stats;
using EnglishApp.Api.DTOs.Users;
using EnglishApp.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishApp.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/stats")]
public sealed class StatsController : ControllerBase
{
    private readonly IStatsService _stats;
    private readonly ICurrentUser _currentUser;

    public StatsController(IStatsService stats, ICurrentUser currentUser)
    {
        _stats = stats;
        _currentUser = currentUser;
    }

    [HttpGet("overview")]
    [ProducesResponseType(typeof(StatsOverviewDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<StatsOverviewDto>> Overview(CancellationToken ct) =>
        Ok(await _stats.GetOverviewAsync(_currentUser.UserId, ct));

    [HttpGet("daily")]
    [ProducesResponseType(typeof(IReadOnlyList<DailyStatDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<DailyStatDto>>> Daily(
        [FromQuery] DateOnly? from, [FromQuery] DateOnly? to, CancellationToken ct)
    {
        var end = to ?? DateOnly.FromDateTime(DateTime.UtcNow);
        var start = from ?? end.AddDays(-13);
        return Ok(await _stats.GetDailyAsync(_currentUser.UserId, start, end, ct));
    }

    [HttpGet("heatmap")]
    [ProducesResponseType(typeof(HeatmapDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<HeatmapDto>> Heatmap(
        [FromQuery] int days = 90, CancellationToken ct = default) =>
        Ok(await _stats.GetHeatmapAsync(_currentUser.UserId, days, ct));

    [HttpGet("skills")]
    [ProducesResponseType(typeof(SkillRadarDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<SkillRadarDto>> Skills(CancellationToken ct) =>
        Ok(await _stats.GetSkillsAsync(_currentUser.UserId, ct));

    [HttpPost("skills/recalculate")]
    [ProducesResponseType(typeof(IReadOnlyList<SkillScoreDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<SkillScoreDto>>> Recalculate(CancellationToken ct) =>
        Ok(await _stats.RecalculateSkillsAsync(_currentUser.UserId, ct));
}
