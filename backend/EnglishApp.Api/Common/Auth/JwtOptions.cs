namespace EnglishApp.Api.Common.Auth;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "Skyword";
    public string Audience { get; set; } = "SkywordClient";
    public string Key { get; set; } = string.Empty;
    public int AccessTokenMinutes { get; set; } = 120;
    public int RefreshTokenDays { get; set; } = 30;
}
