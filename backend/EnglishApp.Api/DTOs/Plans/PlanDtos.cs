using System.ComponentModel.DataAnnotations;

namespace EnglishApp.Api.DTOs.Plans;

public sealed record PlanTaskDto(
    int Id,
    byte SkillId,
    string SkillCode,
    string SkillNameVi,
    string Title,
    DateOnly DueDate,
    bool IsDone,
    int? LessonId,
    int? PassageId,
    int? ScenarioId);

public sealed record LearningPlanDto(
    int Id,
    DateOnly StartDate,
    DateOnly EndDate,
    string Status,
    int DoneTasks,
    int TotalTasks,
    IReadOnlyList<PlanTaskDto> Tasks);

public sealed record GeneratePlanRequest(
    [Range(3, 90)] int Days = 14,
    [Range(5, 120)] int MinutesPerDay = 20,
    string? FocusSkill = null);

public sealed record CreatePlanTaskRequest(
    [Range(1, 6)] byte SkillId,
    [Required, MaxLength(200)] string Title,
    DateOnly DueDate,
    int? LessonId = null,
    int? PassageId = null,
    int? ScenarioId = null);

public sealed record CompleteTaskRequest(bool IsDone = true);
