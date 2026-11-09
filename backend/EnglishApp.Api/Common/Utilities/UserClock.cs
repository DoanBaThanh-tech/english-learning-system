namespace EnglishApp.Api.Common.Utilities;

public static class UserClock
{
    private const string FallbackTimeZone = "SE Asia Standard Time";

    public static DateTime Today(string? timeZoneId)
    {
        var id = string.IsNullOrWhiteSpace(timeZoneId) ? FallbackTimeZone : timeZoneId;
        try
        {
            var zone = TimeZoneInfo.FindSystemTimeZoneById(id);
            return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, zone).Date;
        }
        catch (TimeZoneNotFoundException)
        {
            return DateTime.UtcNow.Date;
        }
        catch (InvalidTimeZoneException)
        {
            return DateTime.UtcNow.Date;
        }
    }

    public static DateTime LocalNow(string? timeZoneId)
    {
        var id = string.IsNullOrWhiteSpace(timeZoneId) ? FallbackTimeZone : timeZoneId;
        try
        {
            var zone = TimeZoneInfo.FindSystemTimeZoneById(id);
            return TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, zone);
        }
        catch (Exception) when (timeZoneId is not null)
        {
            return DateTime.UtcNow;
        }
    }
}
