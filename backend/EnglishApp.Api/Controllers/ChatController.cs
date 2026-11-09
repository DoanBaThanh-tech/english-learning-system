using EnglishApp.Api.Common.Auth;
using EnglishApp.Api.DTOs.Chat;
using EnglishApp.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishApp.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/chat")]
public sealed class ChatController : ControllerBase
{
    private readonly IChatService _chat;
    private readonly ICurrentUser _currentUser;

    public ChatController(IChatService chat, ICurrentUser currentUser)
    {
        _chat = chat;
        _currentUser = currentUser;
    }

    [HttpGet("scenarios")]
    public async Task<ActionResult<IReadOnlyList<ChatScenarioDto>>> Scenarios(CancellationToken ct) =>
        Ok(await _chat.GetScenariosAsync(ct));

    [HttpPost("scenarios")]
    public async Task<ActionResult<ChatScenarioDto>> CreateScenario(
        [FromBody] CreateScenarioRequest request, CancellationToken ct) =>
        Ok(await _chat.CreateScenarioAsync(request, ct));

    [HttpGet("sessions")]
    public async Task<ActionResult<IReadOnlyList<ChatSessionDto>>> Sessions(CancellationToken ct) =>
        Ok(await _chat.GetSessionsAsync(_currentUser.UserId, ct));

    [HttpPost("sessions")]
    public async Task<ActionResult<ChatSessionDto>> CreateSession(
        [FromBody] CreateChatSessionRequest request, CancellationToken ct) =>
        Ok(await _chat.CreateSessionAsync(_currentUser.UserId, request, ct));

    [HttpGet("sessions/{id:long}")]
    public async Task<ActionResult<ChatSessionDetailDto>> GetSession(long id, CancellationToken ct) =>
        Ok(await _chat.GetSessionAsync(_currentUser.UserId, id, ct));

    [HttpDelete("sessions/{id:long}")]
    public async Task<IActionResult> DeleteSession(long id, CancellationToken ct)
    {
        await _chat.DeleteSessionAsync(_currentUser.UserId, id, ct);
        return NoContent();
    }

    [HttpPost("sessions/{id:long}/messages")]
    public async Task<ActionResult<SendMessageResult>> Send(
        long id, [FromBody] SendMessageRequest request, CancellationToken ct) =>
        Ok(await _chat.SendMessageAsync(_currentUser.UserId, id, request, ct));
}
