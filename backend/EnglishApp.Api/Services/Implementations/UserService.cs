using EnglishApp.Api.Common.Exceptions;
using EnglishApp.Api.Common.Utilities;
using EnglishApp.Api.Data;
using EnglishApp.Api.DTOs.Users;
using EnglishApp.Api.Repositories.Specific;
using EnglishApp.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishApp.Api.Services.Implementations;

public sealed class UserService : IUserService
{
    private readonly AppDbContext _db;
    private readonly IUserRepository _users;
    private readonly IStatsService _stats;

    public UserService(AppDbContext db, IUserRepository users, IStatsService stats)
    {
        _db = db;
        _users = users;
        _stats = stats;
    }

    public async Task<UserProfileDto> GetProfileAsync(int userId, CancellationToken ct = default)
    {
        var user = await _users.GetProfileAsync(userId, ct)
                   ?? throw new NotFoundException("Không tìm thấy người dùng.");
        return UserMapper.ToProfile(user);
    }

    public async Task<UserProfileDto> UpdateProfileAsync(
        int userId, UpdateProfileRequest request, CancellationToken ct = default)
    {
        var user = await _db.Users
            .Include(u => u.CurrentLevel)
            .FirstOrDefaultAsync(u => u.Id == userId, ct)
            ?? throw new NotFoundException("Không tìm thấy người dùng.");

        if (request.CurrentLevelId is not null)
        {
            var level = await _users.GetLevelAsync(request.CurrentLevelId.Value, ct)
                        ?? throw new BadRequestException("Trình độ không hợp lệ.");
            user.CurrentLevelId = level.Id;
            user.CurrentLevel = level;
        }

        if (request.DailyWordGoal is not null)
        {
            user.DailyWordGoal = request.DailyWordGoal.Value;
        }

        if (!string.IsNullOrWhiteSpace(request.TimeZoneId))
        {
            try
            {
                TimeZoneInfo.FindSystemTimeZoneById(request.TimeZoneId);
                user.TimeZoneId = request.TimeZoneId;
            }
            catch (Exception ex) when (ex is TimeZoneNotFoundException or InvalidTimeZoneException)
            {
                throw new BadRequestException("Múi giờ không hợp lệ.");
            }
        }

        // Gán cả khi null để người dùng có thể bỏ chọn mục tiêu trong Hồ sơ.
        user.LearningPurpose = OnboardingCodes.CleanPurpose(request.LearningPurpose);

        user.DisplayName = request.DisplayName.Trim();
        user.AvatarUrl = string.IsNullOrWhiteSpace(request.AvatarUrl) ? null : request.AvatarUrl.Trim();

        await _db.SaveChangesAsync(ct);
        return UserMapper.ToProfile(user);
    }

    public Task<DashboardDto> GetDashboardAsync(int userId, CancellationToken ct = default) =>
        _stats.GetDashboardAsync(userId, ct);
}
