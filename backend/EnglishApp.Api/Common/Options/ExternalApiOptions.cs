namespace EnglishApp.Api.Common.Options;

public sealed class ExternalApiOptions
{
    public const string SectionName = "ExternalApis";

    public int TimeoutSeconds { get; set; } = 15;
    public string UserAgent { get; set; } = "Skyword/1.0 (personal English learning app)";
    public bool EnableTranslation { get; set; } = true;
    public bool EnableDictionary { get; set; } = true;
}
