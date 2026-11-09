using System.ComponentModel.DataAnnotations;
using EnglishApp.Api.DTOs.Users;

namespace EnglishApp.Api.DTOs.Auth;

public sealed record RegisterRequest(
    [Required, EmailAddress, MaxLength(256)] string Email,
    [Required, MinLength(8), MaxLength(100)] string Password,
    [Required, MaxLength(100)] string DisplayName,
    byte? CurrentLevelId = null,
    string? TimeZoneId = null);

public sealed record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required] string Password);

public sealed record RefreshRequest([Required] string RefreshToken);

public sealed record LogoutRequest([Required] string RefreshToken);

public sealed record ChangePasswordRequest(
    [Required] string CurrentPassword,
    [Required, MinLength(8), MaxLength(100)] string NewPassword);

public sealed record TokenResponse(
    string AccessToken,
    string RefreshToken,
    DateTime AccessTokenExpiresAtUtc,
    UserProfileDto User);
