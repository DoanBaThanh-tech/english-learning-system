using EnglishApp.Api.Common.Auth;
using EnglishApp.Api.DTOs.Lessons;
using EnglishApp.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishApp.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/lessons")]
public sealed class LessonsController : ControllerBase
{
    private readonly ISourceLessonService _lessons;
    private readonly ICurrentUser _currentUser;

    public LessonsController(ISourceLessonService lessons, ICurrentUser currentUser)
    {
        _lessons = lessons;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<LessonSummaryDto>>> List(CancellationToken ct) =>
        Ok(await _lessons.ListLessonsAsync(_currentUser.UserId, ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<LessonDetailDto>> Get(int id, CancellationToken ct) =>
        Ok(await _lessons.GetLessonAsync(_currentUser.UserId, id, ct));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _lessons.DeleteLessonAsync(_currentUser.UserId, id, ct);
        return NoContent();
    }
}
