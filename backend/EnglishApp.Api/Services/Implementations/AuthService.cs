using System.Security.Cryptography;
using System.Text;
using EnglishApp.Api.Common.Auth;
using EnglishApp.Api.Common.Exceptions;
using EnglishApp.Api.Common.Utilities;
using EnglishApp.Api.Data;
using EnglishApp.Api.DTOs.Auth;
using EnglishApp.Api.Models;
using EnglishApp.Api.Repositories.Specific;
using EnglishApp.Api.Services.Interfaces;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;

namespace EnglishApp.Api.Services.Implementations;

public sealed class AuthService : IAuthService
{
    private readonly AppDbContext _db;
    private readonly IUserRepository _users;
    private readonly IJwtTokenService _jwt;
    private readonly JwtOptions _jwtOptions;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        AppDbContext db,
        IUserRepository users,
        IJwtTokenService jwt,
        JwtOptions jwtOptions,
        ILogger<AuthService> logger)
    {
        _db = db;
        _users = users;
        _jwt = jwt;
        _jwtOptions = jwtOptions;
        _logger = logger;
    }

    public async Task<TokenResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default)
    {
        var email = TextUtil.Normalize(request.Email);
        if (string.IsNullOrWhiteSpace(email) || !email.Contains('@'))
        {
            throw new BadRequestException("Email không hợp lệ.");
        }

        if (await _users.EmailExistsAsync(email, ct))
        {
            throw new ConflictException("Email này đã được sử dụng.");
        }

        Level? level = null;
        if (request.CurrentLevelId is not null)
        {
            level = await _users.GetLevelAsync(request.CurrentLevelId.Value, ct)
                    ?? throw new BadRequestException("Trình độ không hợp lệ.");
        }

        var timeZone = ValidateTimeZone(request.TimeZoneId, "SE Asia Standard Time");

        var user = new User
        {
            Email = email,
            PasswordHash = PasswordHasher.Hash(request.Password),
            DisplayName = request.DisplayName.Trim(),
            CurrentLevelId = level?.Id,
            CurrentLevel = level,
            DailyWordGoal = request.DailyWordGoal ?? 20,
            TimeZoneId = timeZone,
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        _logger.LogInformation("New user registered: {Email}", email);
        return await IssueTokensAsync(user, ct);
    }

    public async Task<TokenResponse> LoginAsync(LoginRequest request, CancellationToken ct = default)
    {
        var user = await _users.GetByEmailAsync(request.Email, ct);
        if (user is null || !PasswordHasher.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedException("Email hoặc mật khẩu không đúng.");
        }

        if (!user.IsActive)
        {
            throw new ForbiddenException("Tài khoản đã bị khóa.");
        }

        return await IssueTokensAsync(user, ct);
    }

    public async Task<TokenResponse> RefreshAsync(string refreshToken, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken))
        {
            throw new UnauthorizedException("Refresh token không hợp lệ.");
        }

        var hash = HashToken(refreshToken);
        var stored = await _db.RefreshTokens
            .Include(r => r.User).ThenInclude(u => u.CurrentLevel)
            .FirstOrDefaultAsync(r => r.TokenHash == hash, ct);

        if (stored is null || stored.RevokedAt is not null || stored.ExpiresAt <= DateTime.UtcNow)
        {
            throw new UnauthorizedException("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        }

        if (!stored.User.IsActive)
        {
            throw new ForbiddenException("Tài khoản đã bị khóa.");
        }

        stored.RevokedAt = DateTime.UtcNow;
        return await IssueTokensAsync(stored.User, ct);
    }

    public async Task LogoutAsync(string refreshToken, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(refreshToken)) return;

        var hash = HashToken(refreshToken);
        var stored = await _db.RefreshTokens.FirstOrDefaultAsync(r => r.TokenHash == hash, ct);
        if (stored is not null && stored.RevokedAt is null)
        {
            stored.RevokedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync(ct);
        }
    }

    public async Task ChangePasswordAsync(int userId, ChangePasswordRequest request, CancellationToken ct = default)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct)
                   ?? throw new NotFoundException("Không tìm thấy người dùng.");

        if (!PasswordHasher.Verify(request.CurrentPassword, user.PasswordHash))
        {
            throw new BadRequestException("Mật khẩu hiện tại không đúng.");
        }

        if (PasswordHasher.Verify(request.NewPassword, user.PasswordHash))
        {
            throw new BadRequestException("Mật khẩu mới phải khác mật khẩu hiện tại.");
        }

        user.PasswordHash = PasswordHasher.Hash(request.NewPassword);

        var activeTokens = await _db.RefreshTokens
            .Where(r => r.UserId == userId && r.RevokedAt == null)
            .ToListAsync(ct);

        foreach (var token in activeTokens)
        {
            token.RevokedAt = DateTime.UtcNow;
        }

        await _db.SaveChangesAsync(ct);
    }

    private async Task<TokenResponse> IssueTokensAsync(User user, CancellationToken ct)
    {
        var access = _jwt.CreateAccessToken(user);
        var refreshRaw = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(64));
        var refresh = new RefreshToken
        {
            UserId = user.Id,
            TokenHash = HashToken(refreshRaw),
            ExpiresAt = DateTime.UtcNow.AddDays(Math.Max(1, _jwtOptions.RefreshTokenDays))
        };

        _db.RefreshTokens.Add(refresh);
        await _db.SaveChangesAsync(ct);

        return new TokenResponse(
            access.Token,
            refreshRaw,
            access.ExpiresAtUtc,
            UserMapper.ToProfile(user));
    }

    private static byte[] HashToken(string token) =>
        SHA256.HashData(Encoding.UTF8.GetBytes(token));

    private static string ValidateTimeZone(string? requested, string fallback)
    {
        if (string.IsNullOrWhiteSpace(requested))
        {
            return fallback;
        }

        try
        {
            TimeZoneInfo.FindSystemTimeZoneById(requested);
            return requested;
        }
        catch (Exception ex) when (ex is TimeZoneNotFoundException or InvalidTimeZoneException)
        {
            throw new BadRequestException("Múi giờ không hợp lệ.");
        }
    }
}
