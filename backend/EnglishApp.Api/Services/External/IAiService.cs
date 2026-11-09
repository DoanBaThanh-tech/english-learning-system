namespace EnglishApp.Api.Services.External;

public sealed record AiTurn(string Role, string Content);

public sealed record AiCorrection(string Original, string Correction, string Explanation);

public sealed record AiChatCompletion(
    string Reply,
    string? Corrected,
    IReadOnlyList<AiCorrection> Corrections);

public sealed record AiContextTranslation(
    string MeaningVi,
    int ChosenSenseIndex,
    double Confidence,
    string? Explanation);

public interface IAiService
{
    bool IsEnabled { get; }
    Task<AiChatCompletion?> ChatAsync(
        string systemPrompt,
        IReadOnlyList<AiTurn> history,
        string userMessage,
        CancellationToken ct = default);

    Task<AiContextTranslation?> TranslateInContextAsync(
        string word,
        string sentence,
        IReadOnlyList<string> definitions,
        CancellationToken ct = default);
}
