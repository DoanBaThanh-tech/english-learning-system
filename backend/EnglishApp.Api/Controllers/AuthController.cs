using EnglishApp.Api.Common.Auth;
using EnglishApp.Api.DTOs.Auth;
using EnglishApp.Api.DTOs.Users;
using EnglishApp.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishApp.Api.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController : ControllerBase
{
    private readonly IAuthService _auth;
    private readonly IUserService _users;
    private readonly ICurrentUser _currentUser;

    public AuthController(IAuthService auth, IUserService users, ICurrentUser currentUser)
    {
        _auth = auth;
        _users = users;
        _currentUser = currentUser;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(TokenResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<TokenResponse>> Register(
        [FromBody] RegisterRequest request, CancellationToken ct) =>
        Ok(await _auth.RegisterAsync(request, ct));

    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(TokenResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<TokenResponse>> Login(
        [FromBody] LoginRequest request, CancellationToken ct) =>
        Ok(await _auth.LoginAsync(request, ct));

    [HttpPost("refresh")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(TokenResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<TokenResponse>> Refresh(
        [FromBody] RefreshRequest request, CancellationToken ct) =>
        Ok(await _auth.RefreshAsync(request.RefreshToken, ct));

    [HttpPost("logout")]
    [AllowAnonymous] // Chỉ cần refresh token để thu hồi phiên, kể cả khi access token đã hết hạn.
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Logout([FromBody] LogoutRequest request, CancellationToken ct)
    {
        await _auth.LogoutAsync(request.RefreshToken, ct);
        return NoContent();
    }

    [HttpPost("change-password")]
    [Authorize]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> ChangePassword(
        [FromBody] ChangePasswordRequest request, CancellationToken ct)
    {
        await _auth.ChangePasswordAsync(_currentUser.UserId, request, ct);
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserProfileDto>> Me(CancellationToken ct) =>
        Ok(await _users.GetProfileAsync(_currentUser.UserId, ct));
}
