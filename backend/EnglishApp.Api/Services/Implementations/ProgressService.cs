using EnglishApp.Api.Common.Utilities;
using EnglishApp.Api.Data;
using EnglishApp.Api.Models;
using EnglishApp.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishApp.Api.Services.Implementations;

public sealed class ProgressService : IProgressService
{
    private readonly AppDbContext _db;

    public ProgressService(AppDbContext db) => _db = db;

    public async Task TouchAsync(
        int userId,
        int learned = 0,
        int reviewed = 0,
        int minutes = 0,
        CancellationToken ct = default)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null)
        {
            return;
        }

        var today = DateOnly.FromDateTime(UserClock.Today(user.TimeZoneId));
        var stat = await _db.UserDailyStats
            .FirstOrDefaultAsync(s => s.UserId == userId && s.StatDate == today, ct);

        if (stat is null)
        {
            stat = new UserDailyStat { UserId = userId, StatDate = today };
            _db.UserDailyStats.Add(stat);
        }

        stat.WordsLearned = ClampShort(stat.WordsLearned + learned);
        stat.WordsReviewed = ClampShort(stat.WordsReviewed + reviewed);
        stat.MinutesStudied = ClampShort(stat.MinutesStudied + minutes);
        stat.GoalMet = stat.WordsLearned >= user.DailyWordGoal;

        await _db.SaveChangesAsync(ct);
    }

    private static short ClampShort(int value) => (short)Math.Clamp(value, 0, short.MaxValue);
}
