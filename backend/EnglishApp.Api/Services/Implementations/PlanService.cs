using EnglishApp.Api.Common.Exceptions;
using EnglishApp.Api.Common.Utilities;
using EnglishApp.Api.Data;
using EnglishApp.Api.DTOs.Plans;
using EnglishApp.Api.Models;
using EnglishApp.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishApp.Api.Services.Implementations;

/// <summary>
/// Sinh lộ trình 3-90 ngày dựa trên trình độ, mục tiêu ngày, bài đọc/kịch bản/bài học
/// sẵn có và điểm kỹ năng. Đây là "AI planner" phiên bản offline; khi bật AI có thể
/// thay phần chọn tác vụ bằng gợi ý từ LLM mà không đổi API.
/// </summary>
public sealed class PlanService : IPlanService
{
    private static readonly Dictionary<string, string> TaskTitles = new()
    {
        ["vocabulary"] = "Học {0} từ mới theo ngữ cảnh",
        ["listening"] = "Nghe chép chính tả 5 phút",
        ["speaking"] = "Luyện nói cùng chatbot AI",
        ["reading"] = "Đọc hiểu và lưu 5 từ mới",
        ["grammar"] = "Ôn 10 câu sai trong nhật ký lỗi"
    };

    private readonly AppDbContext _db;

    public PlanService(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<LearningPlanDto>> ListAsync(
        int userId, CancellationToken ct = default)
    {
        var plans = await _db.LearningPlans
            .AsNoTracking()
            .Include(p => p.PlanTasks).ThenInclude(t => t.Skill)
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.StartDate)
            .Take(20)
            .ToListAsync(ct);

        return plans.Select(Map).ToList();
    }

    public async Task<LearningPlanDto> GetAsync(int userId, int planId, CancellationToken ct = default)
    {
        var plan = await _db.LearningPlans
            .AsNoTracking()
            .Include(p => p.PlanTasks).ThenInclude(t => t.Skill)
            .FirstOrDefaultAsync(p => p.Id == planId && p.UserId == userId, ct)
            ?? throw new NotFoundException("Không tìm thấy lộ trình.");

        return Map(plan);
    }

    public async Task<LearningPlanDto> GenerateAsync(
        int userId, GeneratePlanRequest request, CancellationToken ct = default)
    {
        var user = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId, ct)
                   ?? throw new NotFoundException("Không tìm thấy người dùng.");

        var days = Math.Clamp(request.Days, 3, 90);
        var skills = await _db.Skills.AsNoTracking().ToDictionaryAsync(s => s.Code, s => s.Id, ct);

        string? focus = null;
        if (!string.IsNullOrWhiteSpace(request.FocusSkill))
        {
            focus = request.FocusSkill.Trim().ToLowerInvariant();
            if (!skills.ContainsKey(focus))
            {
                throw new BadRequestException("Kỹ năng trọng tâm không hợp lệ.");
            }
        }

        var start = DateOnly.FromDateTime(UserClock.Today(user.TimeZoneId));

        var activePlans = await _db.LearningPlans
            .Where(p => p.UserId == userId && p.Status == "active")
            .ToListAsync(ct);

        foreach (var previous in activePlans)
        {
            previous.Status = "cancelled";
        }

        var plan = new LearningPlan
        {
            UserId = userId,
            StartDate = start,
            EndDate = start.AddDays(days - 1),
            Status = "active"
        };

        var passages = await _db.ReadingPassages
            .AsNoTracking()
            .Where(p => user.CurrentLevelId == null || p.LevelId == user.CurrentLevelId)
            .OrderBy(p => p.Id)
            .Take(12)
            .ToListAsync(ct);

        if (passages.Count == 0)
        {
            passages = await _db.ReadingPassages.AsNoTracking().OrderBy(p => p.Id).Take(12).ToListAsync(ct);
        }

        var scenarios = await _db.ChatScenarios
            .AsNoTracking()
            .Where(s => user.CurrentLevelId == null || s.LevelId == user.CurrentLevelId)
            .OrderBy(s => s.Id)
            .Take(12)
            .ToListAsync(ct);

        if (scenarios.Count == 0)
        {
            scenarios = await _db.ChatScenarios.AsNoTracking().OrderBy(s => s.Id).Take(12).ToListAsync(ct);
        }

        var lessons = await _db.GeneratedLessons
            .AsNoTracking()
            .Where(l => l.UserId == userId)
            .OrderByDescending(l => l.CreatedAt)
            .Take(12)
            .ToListAsync(ct);

        for (var day = 0; day < days; day++)
        {
            var due = start.AddDays(day);

            if (skills.TryGetValue("vocabulary", out var vocabularyId))
            {
                plan.PlanTasks.Add(new PlanTask
                {
                    SkillId = vocabularyId,
                    Title = string.Format(TaskTitles["vocabulary"], user.DailyWordGoal),
                    DueDate = due
                });
            }

            if (day % 2 == 0 && skills.TryGetValue("reading", out var readingId) && passages.Count > 0)
            {
                var passage = passages[(day / 2) % passages.Count];
                plan.PlanTasks.Add(new PlanTask
                {
                    SkillId = readingId,
                    Title = $"{TaskTitles["reading"]}: {passage.Title}",
                    DueDate = due,
                    PassageId = passage.Id
                });
            }

            if (day % 3 == 2 && skills.TryGetValue("speaking", out var speakingId) && scenarios.Count > 0)
            {
                var scenario = scenarios[day % scenarios.Count];
                plan.PlanTasks.Add(new PlanTask
                {
                    SkillId = speakingId,
                    Title = $"{TaskTitles["speaking"]}: {scenario.Name}",
                    DueDate = due,
                    ScenarioId = scenario.Id
                });
            }

            if (day % 2 == 1 && skills.TryGetValue("listening", out var listeningId))
            {
                plan.PlanTasks.Add(new PlanTask
                {
                    SkillId = listeningId,
                    Title = TaskTitles["listening"],
                    DueDate = due
                });
            }

            if (day % 4 == 3 && skills.TryGetValue("grammar", out var grammarId))
            {
                plan.PlanTasks.Add(new PlanTask
                {
                    SkillId = grammarId,
                    Title = TaskTitles["grammar"],
                    DueDate = due
                });
            }

            if (day % 5 == 4 && lessons.Count > 0)
            {
                var lesson = lessons[day % lessons.Count];
                var lessonSkill = skills.GetValueOrDefault("vocabulary");
                if (lessonSkill > 0)
                {
                    plan.PlanTasks.Add(new PlanTask
                    {
                        SkillId = lessonSkill,
                        Title = $"Ôn bài học: {lesson.Title}",
                        DueDate = due,
                        LessonId = lesson.Id
                    });
                }
            }

            if (focus is not null && focus != "vocabulary" &&
                skills.TryGetValue(focus, out var focusId) &&
                plan.PlanTasks.All(t => t.DueDate != due || t.SkillId != focusId))
            {
                plan.PlanTasks.Add(new PlanTask
                {
                    SkillId = focusId,
                    Title = $"Tăng cường: {FocusTitle(focus)}",
                    DueDate = due
                });
            }
        }

        _db.LearningPlans.Add(plan);
        await _db.SaveChangesAsync(ct);

        var created = await _db.LearningPlans
            .AsNoTracking()
            .Include(p => p.PlanTasks).ThenInclude(t => t.Skill)
            .FirstAsync(p => p.Id == plan.Id, ct);

        return Map(created);
    }

    public async Task DeleteAsync(int userId, int planId, CancellationToken ct = default)
    {
        var plan = await _db.LearningPlans
            .FirstOrDefaultAsync(p => p.Id == planId && p.UserId == userId, ct)
            ?? throw new NotFoundException("Không tìm thấy lộ trình.");

        _db.LearningPlans.Remove(plan);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<PlanTaskDto> AddTaskAsync(
        int userId, int planId, CreatePlanTaskRequest request, CancellationToken ct = default)
    {
        var plan = await _db.LearningPlans
            .FirstOrDefaultAsync(p => p.Id == planId && p.UserId == userId, ct)
            ?? throw new NotFoundException("Không tìm thấy lộ trình.");

        var skill = await _db.Skills.AsNoTracking().FirstOrDefaultAsync(s => s.Id == request.SkillId, ct)
                    ?? throw new BadRequestException("Kỹ năng không hợp lệ.");

        if (request.LessonId is not null &&
            !await _db.GeneratedLessons.AnyAsync(l => l.Id == request.LessonId && l.UserId == userId, ct))
        {
            throw new BadRequestException("Bài học không hợp lệ.");
        }

        if (request.PassageId is not null &&
            !await _db.ReadingPassages.AnyAsync(p => p.Id == request.PassageId, ct))
        {
            throw new BadRequestException("Bài đọc không hợp lệ.");
        }

        if (request.ScenarioId is not null &&
            !await _db.ChatScenarios.AnyAsync(s => s.Id == request.ScenarioId, ct))
        {
            throw new BadRequestException("Kịch bản không hợp lệ.");
        }

        var task = new PlanTask
        {
            PlanId = plan.Id,
            SkillId = skill.Id,
            Title = TextUtil.Truncate(request.Title.Trim(), 200),
            DueDate = request.DueDate,
            LessonId = request.LessonId,
            PassageId = request.PassageId,
            ScenarioId = request.ScenarioId
        };

        _db.PlanTasks.Add(task);
        await _db.SaveChangesAsync(ct);

        return MapTask(task, skill);
    }

    public async Task<PlanTaskDto> CompleteTaskAsync(
        int userId, int planId, int taskId, bool isDone, CancellationToken ct = default)
    {
        var plan = await _db.LearningPlans
            .Include(p => p.PlanTasks)
            .FirstOrDefaultAsync(p => p.Id == planId && p.UserId == userId, ct)
            ?? throw new NotFoundException("Không tìm thấy lộ trình.");

        var task = plan.PlanTasks.FirstOrDefault(t => t.Id == taskId)
                   ?? throw new NotFoundException("Không tìm thấy nhiệm vụ.");

        task.IsDone = isDone;

        if (plan.PlanTasks.Count > 0 && plan.PlanTasks.All(t => t.IsDone))
        {
            plan.Status = "done";
        }
        else if (plan.Status == "done")
        {
            plan.Status = "active";
        }

        await _db.SaveChangesAsync(ct);

        var skill = await _db.Skills.AsNoTracking().FirstAsync(s => s.Id == task.SkillId, ct);
        return MapTask(task, skill);
    }

    private static LearningPlanDto Map(LearningPlan plan)
    {
        var tasks = plan.PlanTasks
            .OrderBy(t => t.DueDate)
            .ThenBy(t => t.Id)
            .Select(t => MapTask(t, t.Skill))
            .ToList();

        return new LearningPlanDto(
            plan.Id,
            plan.StartDate,
            plan.EndDate,
            plan.Status,
            tasks.Count(t => t.IsDone),
            tasks.Count,
            tasks);
    }

    private static PlanTaskDto MapTask(PlanTask task, Skill skill) => new(
        task.Id,
        task.SkillId,
        skill.Code,
        skill.NameVi,
        task.Title,
        task.DueDate,
        task.IsDone,
        task.LessonId,
        task.PassageId,
        task.ScenarioId);

    private static string FocusTitle(string skill) => skill switch
    {
        "listening" => "nghe 10 phút",
        "speaking" => "nói 10 phút",
        "reading" => "đọc 1 bài ngắn",
        "grammar" => "sửa 5 lỗi ngữ pháp",
        _ => "luyện thêm 10 phút"
    };
}
