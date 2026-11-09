using EnglishApp.Api.Common.Auth;
using EnglishApp.Api.DTOs.Errors;
using EnglishApp.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishApp.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/errors")]
public sealed class ErrorsController : ControllerBase
{
    private readonly IErrorService _errors;
    private readonly ICurrentUser _currentUser;

    public ErrorsController(IErrorService errors, ICurrentUser currentUser)
    {
        _errors = errors;
        _currentUser = currentUser;
    }

    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<LearnerErrorDto>>> List(
        [FromQuery] bool? resolved,
        [FromQuery] byte? skillId,
        [FromQuery] int limit = 50,
        CancellationToken ct = default) =>
        Ok(await _errors.ListAsync(_currentUser.UserId, resolved, skillId, limit, ct));

    [HttpGet("summary")]
    public async Task<ActionResult<ErrorSummaryDto>> Summary(CancellationToken ct) =>
        Ok(await _errors.SummaryAsync(_currentUser.UserId, ct));

    [HttpPut("{id:long}/resolve")]
    public async Task<ActionResult<LearnerErrorDto>> Resolve(
        long id, [FromBody] ResolveErrorRequest request, CancellationToken ct) =>
        Ok(await _errors.ResolveAsync(_currentUser.UserId, id, request.IsResolved, ct));

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Remove(long id, CancellationToken ct)
    {
        await _errors.RemoveAsync(_currentUser.UserId, id, ct);
        return NoContent();
    }
}
