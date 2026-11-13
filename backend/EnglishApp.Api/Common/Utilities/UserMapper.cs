using EnglishApp.Api.DTOs.Users;
using EnglishApp.Api.Models;

namespace EnglishApp.Api.Common.Utilities;

public static class UserMapper
{
    public static UserProfileDto ToProfile(User user) => new(
        user.Id,
        user.Email,
        user.DisplayName,
        user.AvatarUrl,
        user.CurrentLevelId,
        user.CurrentLevel?.Code,
        user.CurrentLevel?.Name,
        user.DailyWordGoal,
        user.TimeZoneId,
        user.CreatedAt,
        user.LearningPurpose,
        user.ReferralSource);
}
