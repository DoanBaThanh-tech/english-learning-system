using EnglishApp.Api.DTOs.Plans;

namespace EnglishApp.Api.Services.Interfaces;

public interface IPlanService
{
    Task<IReadOnlyList<LearningPlanDto>> ListAsync(int userId, CancellationToken ct = default);
    Task<LearningPlanDto> GetAsync(int userId, int planId, CancellationToken ct = default);
    Task<LearningPlanDto> GenerateAsync(int userId, GeneratePlanRequest request, CancellationToken ct = default);
    Task DeleteAsync(int userId, int planId, CancellationToken ct = default);
    Task<PlanTaskDto> AddTaskAsync(
        int userId, int planId, CreatePlanTaskRequest request, CancellationToken ct = default);
    Task<PlanTaskDto> CompleteTaskAsync(
        int userId, int planId, int taskId, bool isDone, CancellationToken ct = default);
}
