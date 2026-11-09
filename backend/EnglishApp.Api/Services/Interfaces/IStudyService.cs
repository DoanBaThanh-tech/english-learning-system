using EnglishApp.Api.DTOs.Study;

namespace EnglishApp.Api.Services.Interfaces;

public interface IStudyService
{
    Task<StudySessionDto> StartAsync(int userId, StartSessionRequest request, CancellationToken ct = default);
    Task<StudySessionDto> GetSessionAsync(int userId, long sessionId, CancellationToken ct = default);
    Task<IReadOnlyList<StudySessionDto>> ListAsync(int userId, int limit, CancellationToken ct = default);
    Task<StudyCardDto?> NextAsync(int userId, long sessionId, string? exerciseType, CancellationToken ct = default);
    Task<AnswerResultDto> SubmitAsync(
        int userId, long sessionId, SubmitAnswerRequest request, CancellationToken ct = default);
    Task<StudySessionSummaryDto> FinishAsync(int userId, long sessionId, CancellationToken ct = default);
}
