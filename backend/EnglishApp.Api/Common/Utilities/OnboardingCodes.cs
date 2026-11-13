using EnglishApp.Api.Common.Exceptions;

namespace EnglishApp.Api.Common.Utilities;

/// <summary>
/// Mã câu trả lời onboarding được lưu cùng người dùng. Giữ danh sách tập trung
/// để API và frontend dùng chung một bộ giá trị.
/// </summary>
public static class OnboardingCodes
{
    public static readonly HashSet<string> Purposes = new(StringComparer.OrdinalIgnoreCase)
    {
        "communication", "study_abroad", "work", "ielts", "toeic",
        "travel", "media", "exam", "other"
    };

    public static readonly HashSet<string> Sources = new(StringComparer.OrdinalIgnoreCase)
    {
        "tiktok", "facebook", "instagram", "youtube", "google",
        "friend", "school", "other"
    };

    public static string? CleanPurpose(string? value)
    {
        var clean = Clean(value);
        if (clean is null) return null;
        if (!Purposes.Contains(clean))
        {
            throw new BadRequestException("Mục tiêu học không hợp lệ.");
        }
        return clean;
    }

    public static string? CleanSource(string? value)
    {
        var clean = Clean(value);
        if (clean is null) return null;
        if (!Sources.Contains(clean))
        {
            throw new BadRequestException("Kênh giới thiệu không hợp lệ.");
        }
        return clean;
    }

    private static string? Clean(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var clean = value.Trim().ToLowerInvariant();
        return clean.Length <= 40 ? clean : null;
    }
}
