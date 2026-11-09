using EnglishApp.Api.Common.Auth;
using EnglishApp.Api.DTOs.Plans;
using EnglishApp.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishApp.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/plans")]
public sealed class PlansController : ControllerBase
{
    private readonly IPlanService _plans;
    private readonly ICurrentUser _currentUser;

    public PlansController(IPlanService plans, ICurrentUser currentUser)
    {
        _plans = plans;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<LearningPlanDto>>> List(CancellationToken ct) =>
        Ok(await _plans.ListAsync(_currentUser.UserId, ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<LearningPlanDto>> Get(int id, CancellationToken ct) =>
        Ok(await _plans.GetAsync(_currentUser.UserId, id, ct));

    [HttpPost("generate")]
    public async Task<ActionResult<LearningPlanDto>> Generate(
        [FromBody] GeneratePlanRequest request, CancellationToken ct) =>
        Ok(await _plans.GenerateAsync(_currentUser.UserId, request, ct));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _plans.DeleteAsync(_currentUser.UserId, id, ct);
        return NoContent();
    }

    [HttpPost("{id:int}/tasks")]
    public async Task<ActionResult<PlanTaskDto>> AddTask(
        int id, [FromBody] CreatePlanTaskRequest request, CancellationToken ct) =>
        Ok(await _plans.AddTaskAsync(_currentUser.UserId, id, request, ct));

    [HttpPut("{id:int}/tasks/{taskId:int}/complete")]
    public async Task<ActionResult<PlanTaskDto>> CompleteTask(
        int id, int taskId, [FromBody] CompleteTaskRequest request, CancellationToken ct) =>
        Ok(await _plans.CompleteTaskAsync(_currentUser.UserId, id, taskId, request.IsDone, ct));
}
