using EnglishApp.Api.Common.Exceptions;
using EnglishApp.Api.Common.Utilities;
using EnglishApp.Api.Data;
using EnglishApp.Api.DTOs.Stats;
using EnglishApp.Api.DTOs.Users;
using EnglishApp.Api.Models;
using EnglishApp.Api.Repositories.Specific;
using EnglishApp.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishApp.Api.Services.Implementations;

public sealed class StatsService : IStatsService
{
    private readonly AppDbContext _db;
    private readonly IUserWordRepository _userWords;

    public StatsService(AppDbContext db, IUserWordRepository userWords)
    {
        _db = db;
        _userWords = userWords;
    }

    public async Task<DashboardDto> GetDashboardAsync(int userId, CancellationToken ct = default)
    {
        var user = await _db.Users
            .AsNoTracking()
            .Include(u => u.CurrentLevel)
            .FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundException("Không tìm thấy người dùng.");

        var today = DateOnly.FromDateTime(UserClock.Today(user.TimeZoneId));
        var stats = await _db.UserDailyStats
            .AsNoTracking()
            .Where(s => s.UserId == userId && s.StatDate >= today.AddDays(-13) && s.StatDate <= today)
            .ToListAsync(ct);

        var todayStat = stats.FirstOrDefault(s => s.StatDate == today);
        var weekly = BuildDailyRange(stats, today.AddDays(-6), today);
        var skills = await GetLatestSkillsAsync(user, ct);

        var dueCount = await _userWords.CountDueAsync(userId, ct);
        var totalWords = await _userWords.CountAsync(userId, ct);
        var mastered = await _db.UserWords.CountAsync(uw => uw.UserId == userId && uw.Status == "mastered", ct);

        var nextTaskEntity = await _db.PlanTasks
            .AsNoTracking()
            .Include(t => t.Skill)
            .Include(t => t.Plan)
            .Where(t => t.Plan.UserId == userId && t.Plan.Status == "active" && !t.IsDone)
            .OrderBy(t => t.DueDate)
            .ThenBy(t => t.Id)
            .FirstOrDefaultAsync(ct);

        ActivePlanTaskDto? nextTask = nextTaskEntity is null
            ? null
            : new ActivePlanTaskDto(
                nextTaskEntity.PlanId,
                nextTaskEntity.Id,
                nextTaskEntity.Title,
                nextTaskEntity.DueDate,
                nextTaskEntity.Skill.Code,
                nextTaskEntity.Skill.NameVi);

        var todayDto = new TodayStatsDto(
            todayStat?.WordsLearned ?? 0,
            todayStat?.WordsReviewed ?? 0,
            todayStat?.MinutesStudied ?? 0,
            user.DailyWordGoal,
            todayStat?.GoalMet ?? false);

        return new DashboardDto(
            UserMapper.ToProfile(user),
            await GetStreakAsync(userId, ct),
            todayDto,
            dueCount,
            totalWords,
            mastered,
            weekly,
            skills,
            nextTask);
    }

    public async Task<StatsOverviewDto> GetOverviewAsync(int userId, CancellationToken ct = default)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, ct)
                   ?? throw new NotFoundException("Không tìm thấy người dùng.");

        var today = DateOnly.FromDateTime(UserClock.Today(user.TimeZoneId));
        var from = today.AddDays(-13);

        var stats = await _db.UserDailyStats
            .AsNoTracking()
            .Where(s => s.UserId == userId && s.StatDate >= from && s.StatDate <= today)
            .ToListAsync(ct);

        var todayStat = stats.FirstOrDefault(s => s.StatDate == today);
        var totalWords = await _userWords.CountAsync(userId, ct);
        var dueCount = await _userWords.CountDueAsync(userId, ct);
        var mastered = await _db.UserWords.CountAsync(uw => uw.UserId == userId && uw.Status == "mastered", ct);
        var learning = await _db.UserWords.CountAsync(uw => uw.UserId == userId && uw.Status == "learning", ct);

        var totalAnswers = await _db.StudyAnswers.CountAsync(a => a.Session.UserId == userId, ct);
        var correctAnswers = await _db.StudyAnswers.CountAsync(a => a.Session.UserId == userId && a.IsCorrect, ct);
        var totalMinutes = await _db.UserDailyStats
            .Where(s => s.UserId == userId)
            .SumAsync(s => (int?)s.MinutesStudied, ct) ?? 0;

        var accuracy = totalAnswers == 0 ? 0 : Math.Round(correctAnswers * 100.0 / totalAnswers, 1);

        return new StatsOverviewDto(
            totalWords,
            mastered,
            learning,
            dueCount,
            await GetStreakAsync(userId, ct),
            totalMinutes,
            totalAnswers,
            accuracy,
            new TodayStatsDto(
                todayStat?.WordsLearned ?? 0,
                todayStat?.WordsReviewed ?? 0,
                todayStat?.MinutesStudied ?? 0,
                user.DailyWordGoal,
                todayStat?.GoalMet ?? false),
            BuildDailyRange(stats, from, today),
            await GetLatestSkillsAsync(user, ct));
    }

    public async Task<IReadOnlyList<DailyStatDto>> GetDailyAsync(
        int userId, DateOnly from, DateOnly to, CancellationToken ct = default)
    {
        if (to < from)
        {
            throw new BadRequestException("Ngày kết thúc phải sau ngày bắt đầu.");
        }

        if (to.DayNumber - from.DayNumber > 366)
        {
            throw new BadRequestException("Khoảng thời gian tối đa là 366 ngày.");
        }

        var stats = await _db.UserDailyStats
            .AsNoTracking()
            .Where(s => s.UserId == userId && s.StatDate >= from && s.StatDate <= to)
            .ToListAsync(ct);

        return BuildDailyRange(stats, from, to);
    }

    public async Task<HeatmapDto> GetHeatmapAsync(int userId, int days, CancellationToken ct = default)
    {
        days = Math.Clamp(days, 7, 365);
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        var from = today.AddDays(-(days - 1));
        var fromDateTime = from.ToDateTime(TimeOnly.MinValue);

        var stats = await _db.UserDailyStats
            .AsNoTracking()
            .Where(s => s.UserId == userId && s.StatDate >= from && s.StatDate <= today)
            .ToListAsync(ct);

        var answerCounts = await _db.StudyAnswers
            .AsNoTracking()
            .Where(a => a.Session.UserId == userId && a.AnsweredAt >= fromDateTime)
            .GroupBy(a => a.AnsweredAt.Date)
            .Select(g => new { Date = g.Key, Count = g.Count() })
            .ToListAsync(ct);

        var answerMap = answerCounts.ToDictionary(x => DateOnly.FromDateTime(x.Date), x => x.Count);
        var statMap = stats.ToDictionary(s => s.StatDate);
        var max = Math.Max(1, answerMap.Values.DefaultIfEmpty(0).Max());

        var result = new List<HeatmapDayDto>(days);
        for (var date = from; date <= today; date = date.AddDays(1))
        {
            var answers = answerMap.GetValueOrDefault(date);
            var minutes = statMap.GetValueOrDefault(date)?.MinutesStudied ?? 0;
            var level = answers == 0 ? 0 : Math.Clamp((int)Math.Ceiling(answers * 4.0 / max), 1, 4);
            result.Add(new HeatmapDayDto(date, answers, minutes, level));
        }

        return new HeatmapDto(days, max, result);
    }

    public async Task<SkillRadarDto> GetSkillsAsync(int userId, CancellationToken ct = default)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, ct)
                   ?? throw new NotFoundException("Không tìm thấy người dùng.");

        var skills = await GetLatestSkillsAsync(user, ct);
        var strongest = skills.OrderByDescending(s => s.Score).FirstOrDefault();
        var weakest = skills.OrderBy(s => s.Score).FirstOrDefault();
        var measuredAt = skills.Count == 0 ? DateTime.UtcNow : skills.Max(s => s.MeasuredAt);

        return new SkillRadarDto(
            skills,
            measuredAt,
            strongest?.NameVi ?? string.Empty,
            weakest?.NameVi ?? string.Empty);
    }

    public async Task<IReadOnlyList<SkillScoreDto>> RecalculateSkillsAsync(int userId, CancellationToken ct = default)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, ct)
                   ?? throw new NotFoundException("Không tìm thấy người dùng.");

        var answers = await _db.StudyAnswers
            .AsNoTracking()
            .Include(a => a.ExerciseType)
            .Where(a => a.Session.UserId == userId)
            .ToListAsync(ct);

        var total = answers.Count;
        var correct = answers.Count(a => a.IsCorrect);
        var vocabulary = total == 0 ? 50m : Math.Round(correct * 100m / total, 2);

        var dictation = answers.Where(a => a.ExerciseType.Code == "dictation").ToList();
        var listening = dictation.Count == 0
            ? 50m
            : Math.Round(dictation.Count(a => a.IsCorrect) * 100m / dictation.Count, 2);

        var speaking = await _db.PronunciationAttempts
            .Where(a => a.UserId == userId)
            .Select(a => (double?)a.OverallScore)
            .AverageAsync(ct) ?? 55;

        var reading = await _db.UserPassageProgresses
            .Where(p => p.UserId == userId)
            .Select(p => (double?)p.ProgressPct)
            .AverageAsync(ct) ?? 50;

        var unresolvedErrors = await _db.LearnerErrors
            .CountAsync(e => e.UserId == userId && !e.IsResolved, ct);

        var grammar = Math.Clamp(82m - unresolvedErrors * 4m, 20m, 95m);

        var values = new Dictionary<string, decimal>
        {
            ["vocabulary"] = Math.Clamp(vocabulary, 0, 100),
            ["listening"] = Math.Clamp(listening, 0, 100),
            ["speaking"] = Math.Clamp((decimal)Math.Round(speaking, 2), 0, 100),
            ["reading"] = Math.Clamp((decimal)Math.Round(reading, 2), 0, 100),
            ["grammar"] = grammar
        };

        var skillEntities = await _db.Skills.AsNoTracking().ToListAsync(ct);
        var now = DateTime.UtcNow;

        foreach (var skill in skillEntities)
        {
            if (!values.TryGetValue(skill.Code, out var score)) continue;
            _db.UserSkillScores.Add(new UserSkillScore
            {
                UserId = userId,
                SkillId = skill.Id,
                Score = score,
                MeasuredAt = now
            });
        }

        await _db.SaveChangesAsync(ct);

        return skillEntities
            .Where(s => values.ContainsKey(s.Code))
            .Select(s => new SkillScoreDto(s.Id, s.Code, s.NameVi, values[s.Code], now))
            .OrderBy(s => s.SkillId)
            .ToList();
    }

    public async Task<int> GetStreakAsync(int userId, CancellationToken ct = default)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null) return 0;

        var today = DateOnly.FromDateTime(UserClock.Today(user.TimeZoneId));
        var activeDates = await _db.UserDailyStats
            .AsNoTracking()
            .Where(s => s.UserId == userId &&
                        (s.WordsLearned > 0 || s.WordsReviewed > 0 || s.MinutesStudied > 0))
            .Select(s => s.StatDate)
            .ToListAsync(ct);

        var set = activeDates.ToHashSet();
        var cursor = set.Contains(today) ? today : today.AddDays(-1);
        var streak = 0;

        while (set.Contains(cursor))
        {
            streak++;
            cursor = cursor.AddDays(-1);
        }

        return streak;
    }

    private async Task<IReadOnlyList<SkillScoreDto>> GetLatestSkillsAsync(User user, CancellationToken ct)
    {
        var skills = await _db.Skills.AsNoTracking().OrderBy(s => s.Id).ToListAsync(ct);
        var scores = await _db.UserSkillScores
            .AsNoTracking()
            .Where(s => s.UserId == user.Id)
            .ToListAsync(ct);

        var latestBySkill = scores
            .GroupBy(s => s.SkillId)
            .ToDictionary(g => g.Key, g => g.OrderByDescending(s => s.MeasuredAt).First());

        return skills.Select(skill =>
        {
            var latest = latestBySkill.GetValueOrDefault(skill.Id);
            return new SkillScoreDto(
                skill.Id,
                skill.Code,
                skill.NameVi,
                latest?.Score ?? 50m,
                latest?.MeasuredAt ?? user.CreatedAt);
        }).ToList();
    }

    private static IReadOnlyList<DailyStatDto> BuildDailyRange(
        IEnumerable<UserDailyStat> stats, DateOnly from, DateOnly to)
    {
        var map = stats.ToDictionary(s => s.StatDate);
        var result = new List<DailyStatDto>();

        for (var date = from; date <= to; date = date.AddDays(1))
        {
            var stat = map.GetValueOrDefault(date);
            result.Add(new DailyStatDto(
                date,
                stat?.WordsLearned ?? 0,
                stat?.WordsReviewed ?? 0,
                stat?.MinutesStudied ?? 0,
                stat?.GoalMet ?? false));
        }

        return result;
    }
}
