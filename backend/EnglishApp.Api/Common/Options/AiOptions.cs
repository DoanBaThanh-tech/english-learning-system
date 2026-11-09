namespace EnglishApp.Api.Common.Options;

/// <summary>
/// Cấu hình nhà cung cấp AI tương thích OpenAI. Có thể trỏ tới Gemini free tier,
/// Groq, OpenRouter hoặc một server nội bộ. Để trống ApiKey thì hệ thống dùng
/// bộ chấm/trả lời offline (không gọi mạng, không phát sinh chi phí).
/// </summary>
public sealed class AiOptions
{
    public const string SectionName = "Ai";

    public bool Enabled { get; set; }
    public string BaseUrl { get; set; } = "https://generativelanguage.googleapis.com/v1beta/openai/";
    public string ApiKey { get; set; } = string.Empty;
    public string Model { get; set; } = "gemini-2.5-flash";
    public int TimeoutSeconds { get; set; } = 45;
}
