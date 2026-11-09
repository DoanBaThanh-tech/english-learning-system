using EnglishApp.Api.Common.Auth;
using EnglishApp.Api.DTOs.Study;
using EnglishApp.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishApp.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/study")]
public sealed class StudyController : ControllerBase
{
    private readonly IStudyService _study;
    private readonly ICurrentUser _currentUser;

    public StudyController(IStudyService study, ICurrentUser currentUser)
    {
        _study = study;
        _currentUser = currentUser;
    }

    [HttpPost("sessions")]
    [ProducesResponseType(typeof(StudySessionDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<StudySessionDto>> Start(
        [FromBody] StartSessionRequest request, CancellationToken ct) =>
        Ok(await _study.StartAsync(_currentUser.UserId, request, ct));

    [HttpGet("sessions")]
    [ProducesResponseType(typeof(IReadOnlyList<StudySessionDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<StudySessionDto>>> List(
        [FromQuery] int limit = 10, CancellationToken ct = default) =>
        Ok(await _study.ListAsync(_currentUser.UserId, limit, ct));

    [HttpGet("sessions/{sessionId:long}")]
    [ProducesResponseType(typeof(StudySessionDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<StudySessionDto>> Get(long sessionId, CancellationToken ct) =>
        Ok(await _study.GetSessionAsync(_currentUser.UserId, sessionId, ct));

    [HttpGet("sessions/{sessionId:long}/next")]
    [ProducesResponseType(typeof(StudyCardDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<ActionResult<StudyCardDto>> Next(
        long sessionId, [FromQuery] string? type, CancellationToken ct)
    {
        var card = await _study.NextAsync(_currentUser.UserId, sessionId, type, ct);
        return card is null ? NoContent() : Ok(card);
    }

    [HttpPost("sessions/{sessionId:long}/answers")]
    [ProducesResponseType(typeof(AnswerResultDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<AnswerResultDto>> Submit(
        long sessionId, [FromBody] SubmitAnswerRequest request, CancellationToken ct) =>
        Ok(await _study.SubmitAsync(_currentUser.UserId, sessionId, request, ct));

    [HttpPost("sessions/{sessionId:long}/finish")]
    [ProducesResponseType(typeof(StudySessionSummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<StudySessionSummaryDto>> Finish(long sessionId, CancellationToken ct) =>
        Ok(await _study.FinishAsync(_currentUser.UserId, sessionId, ct));
}
