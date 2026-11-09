using EnglishApp.Api.DTOs.Users;

namespace EnglishApp.Api.Services.Interfaces;

public interface IUserService
{
    Task<UserProfileDto> GetProfileAsync(int userId, CancellationToken ct = default);
    Task<UserProfileDto> UpdateProfileAsync(int userId, UpdateProfileRequest request, CancellationToken ct = default);
    Task<DashboardDto> GetDashboardAsync(int userId, CancellationToken ct = default);
}
