using System.ComponentModel.DataAnnotations;
using EnglishApp.Api.DTOs.Users;

namespace EnglishApp.Api.DTOs.Auth;

public sealed record RegisterRequest(
    [Required, EmailAddress, MaxLength(256)] string Email,
    [Required(ErrorMessage = "Mật khẩu là thông tin bắt buộc.")]
    [StringLength(20, MinimumLength = 8,
        ErrorMessage = "Mật khẩu phải từ 8 đến 20 ký tự và có ít nhất 1 ký tự đặc biệt.")]
    [RegularExpression(@"^(?=.*[^A-Za-z0-9\s])[\s\S]{8,20}$",
        ErrorMessage = "Mật khẩu phải từ 8 đến 20 ký tự và có ít nhất 1 ký tự đặc biệt.")]
    string Password,
    [Required(ErrorMessage = "Tên gọi là thông tin bắt buộc.")]
    [StringLength(30, MinimumLength = 2,
        ErrorMessage = "Tên gọi chỉ được chứa chữ cái và khoảng trắng, tối đa 30 ký tự.")]
    [RegularExpression(@"^[\p{L}\p{M}]+(?: [\p{L}\p{M}]+)*$",
        ErrorMessage = "Tên gọi chỉ được chứa chữ cái và khoảng trắng, không có số hoặc ký tự đặc biệt.")]
    string DisplayName,
    byte? CurrentLevelId = null,
    string? TimeZoneId = null,
    [Range(1, 500)] short? DailyWordGoal = null,
    [MaxLength(40)] string? LearningPurpose = null,
    [MaxLength(40)] string? ReferralSource = null);

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
