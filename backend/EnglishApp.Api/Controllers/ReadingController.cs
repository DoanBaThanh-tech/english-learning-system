using EnglishApp.Api.Common.Auth;
using EnglishApp.Api.DTOs.Reading;
using EnglishApp.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishApp.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/reading")]
public sealed class ReadingController : ControllerBase
{
    private readonly IReadingService _reading;
    private readonly ICurrentUser _currentUser;

    public ReadingController(IReadingService reading, ICurrentUser currentUser)
    {
        _reading = reading;
        _currentUser = currentUser;
    }

    [HttpGet("passages")]
    public async Task<ActionResult<IReadOnlyList<PassageSummaryDto>>> List(
        [FromQuery] byte? levelId, [FromQuery] string? topic, CancellationToken ct) =>
        Ok(await _reading.ListAsync(_currentUser.UserId, levelId, topic, ct));

    [HttpGet("passages/{id:int}")]
    public async Task<ActionResult<PassageDetailDto>> Get(int id, CancellationToken ct) =>
        Ok(await _reading.GetAsync(_currentUser.UserId, id, ct));

    [HttpPost("passages")]
    public async Task<ActionResult<PassageDetailDto>> Create(
        [FromBody] CreatePassageRequest request, CancellationToken ct) =>
        Ok(await _reading.CreateAsync(_currentUser.UserId, request, ct));

    [HttpPut("passages/{id:int}")]
    public async Task<ActionResult<PassageDetailDto>> Update(
        int id, [FromBody] UpdatePassageRequest request, CancellationToken ct) =>
        Ok(await _reading.UpdateAsync(_currentUser.UserId, id, request, ct));

    [HttpDelete("passages/{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken ct)
    {
        await _reading.DeleteAsync(_currentUser.UserId, id, ct);
        return NoContent();
    }

    [HttpPut("passages/{id:int}/progress")]
    public async Task<IActionResult> Progress(
        int id, [FromBody] UpdateProgressRequest request, CancellationToken ct)
    {
        await _reading.UpdateProgressAsync(_currentUser.UserId, id, request.ProgressPct, ct);
        return NoContent();
    }

    [HttpGet("passages/{id:int}/lens")]
    public async Task<ActionResult<PassageLensDto>> Lens(int id, CancellationToken ct) =>
        Ok(await _reading.GetLensAsync(_currentUser.UserId, id, ct));
}
