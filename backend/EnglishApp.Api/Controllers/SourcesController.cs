using EnglishApp.Api.Common.Auth;
using EnglishApp.Api.DTOs.Lessons;
using EnglishApp.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishApp.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/sources")]
public sealed class SourcesController : ControllerBase
{
    private readonly ISourceLessonService _sources;
    private readonly ICurrentUser _currentUser;

    public SourcesController(ISourceLessonService sources, ICurrentUser currentUser)
    {
        _sources = sources;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<SourceDto>>> List(CancellationToken ct) =>
        Ok(await _sources.ListSourcesAsync(_currentUser.UserId, ct));

    [HttpGet("{id:int}")]
    public async Task<ActionResult<SourceDto>> Get(int id, CancellationToken ct) =>
        Ok(await _sources.GetSourceAsync(_currentUser.UserId, id, ct));

    [HttpPost]
    public async Task<ActionResult<SourceDto>> Create(
        [FromBody] CreateSourceRequest request, CancellationToken ct) =>
        Ok(await _sources.CreateSourceAsync(_currentUser.UserId, request, ct));

    [HttpPut("{id:int}")]
    public async Task<ActionResult<SourceDto>> Update(
        int id, [FromBody] UpdateSourceRequest request, CancellationToken ct) =>
        Ok(await _sources.UpdateSourceAsync(_currentUser.UserId, id, request, ct));

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _sources.DeleteSourceAsync(_currentUser.UserId, id, ct);
        return NoContent();
    }

    [HttpPost("{id:int}/generate-lesson")]
    public async Task<ActionResult<LessonDetailDto>> GenerateLesson(
        int id, [FromBody] GenerateLessonRequest request, CancellationToken ct) =>
        Ok(await _sources.GenerateLessonAsync(_currentUser.UserId, id, request, ct));
}
