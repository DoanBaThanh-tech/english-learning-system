using EnglishApp.Api.Common.Auth;
using EnglishApp.Api.DTOs.Pronunciation;
using EnglishApp.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishApp.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/pronunciation")]
public sealed class PronunciationController : ControllerBase
{
    private readonly IPronunciationService _pronunciation;
    private readonly ICurrentUser _currentUser;

    public PronunciationController(IPronunciationService pronunciation, ICurrentUser currentUser)
    {
        _pronunciation = pronunciation;
        _currentUser = currentUser;
    }

    [HttpPost("analyze")]
    [ProducesResponseType(typeof(PronunciationAttemptDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<PronunciationAttemptDto>> Analyze(
        [FromBody] AnalyzePronunciationRequest request, CancellationToken ct) =>
        Ok(await _pronunciation.AnalyzeAsync(_currentUser.UserId, request, ct));

    [HttpPost("analyze-audio")]
    [RequestSizeLimit(20 * 1024 * 1024)]
    [ProducesResponseType(typeof(PronunciationAttemptDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<PronunciationAttemptDto>> AnalyzeAudio(
        [FromForm] IFormFile? audio,
        [FromForm] string referenceText,
        [FromForm] string? transcript,
        [FromForm] int? wordId,
        CancellationToken ct) =>
        Ok(await _pronunciation.AnalyzeAudioAsync(
            _currentUser.UserId, audio, wordId, referenceText, transcript, ct));

    [HttpGet("attempts")]
    [ProducesResponseType(typeof(IReadOnlyList<PronunciationAttemptDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<PronunciationAttemptDto>>> List(
        [FromQuery] int limit = 20, CancellationToken ct = default) =>
        Ok(await _pronunciation.ListAsync(_currentUser.UserId, limit, ct));

    [HttpGet("attempts/{id:long}")]
    [ProducesResponseType(typeof(PronunciationAttemptDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<PronunciationAttemptDto>> Get(long id, CancellationToken ct) =>
        Ok(await _pronunciation.GetAsync(_currentUser.UserId, id, ct));

    [HttpGet("summary")]
    [ProducesResponseType(typeof(PronunciationSummaryDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<PronunciationSummaryDto>> Summary(CancellationToken ct) =>
        Ok(await _pronunciation.SummaryAsync(_currentUser.UserId, ct));
}
