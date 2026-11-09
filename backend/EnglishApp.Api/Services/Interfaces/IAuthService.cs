using EnglishApp.Api.DTOs.Auth;

namespace EnglishApp.Api.Services.Interfaces;

public interface IAuthService
{
    Task<TokenResponse> RegisterAsync(RegisterRequest request, CancellationToken ct = default);
    Task<TokenResponse> LoginAsync(LoginRequest request, CancellationToken ct = default);
    Task<TokenResponse> RefreshAsync(string refreshToken, CancellationToken ct = default);
    Task LogoutAsync(string refreshToken, CancellationToken ct = default);
    Task ChangePasswordAsync(int userId, ChangePasswordRequest request, CancellationToken ct = default);
}
