using EnglishApp.Api.Common.Auth;
using EnglishApp.Api.DTOs.Users;
using EnglishApp.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishApp.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/users")]
public sealed class UsersController : ControllerBase
{
    private readonly IUserService _users;
    private readonly ICurrentUser _currentUser;

    public UsersController(IUserService users, ICurrentUser currentUser)
    {
        _users = users;
        _currentUser = currentUser;
    }

    [HttpGet("me")]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserProfileDto>> GetMe(CancellationToken ct) =>
        Ok(await _users.GetProfileAsync(_currentUser.UserId, ct));

    [HttpPut("me")]
    [ProducesResponseType(typeof(UserProfileDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserProfileDto>> UpdateMe(
        [FromBody] UpdateProfileRequest request, CancellationToken ct) =>
        Ok(await _users.UpdateProfileAsync(_currentUser.UserId, request, ct));

    [HttpGet("me/dashboard")]
    [ProducesResponseType(typeof(DashboardDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<DashboardDto>> Dashboard(CancellationToken ct) =>
        Ok(await _users.GetDashboardAsync(_currentUser.UserId, ct));
}
