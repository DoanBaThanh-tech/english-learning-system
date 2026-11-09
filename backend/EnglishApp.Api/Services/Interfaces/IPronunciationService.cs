using EnglishApp.Api.DTOs.Pronunciation;

namespace EnglishApp.Api.Services.Interfaces;

public interface IPronunciationService
{
    Task<PronunciationAttemptDto> AnalyzeAsync(
        int userId, AnalyzePronunciationRequest request, CancellationToken ct = default);

    Task<PronunciationAttemptDto> AnalyzeAudioAsync(
        int userId, IFormFile? audio, int? wordId, string referenceText, string? transcript,
        CancellationToken ct = default);

    Task<IReadOnlyList<PronunciationAttemptDto>> ListAsync(
        int userId, int limit, CancellationToken ct = default);

    Task<PronunciationAttemptDto> GetAsync(int userId, long id, CancellationToken ct = default);
    Task<PronunciationSummaryDto> SummaryAsync(int userId, CancellationToken ct = default);
}
