using EnglishApp.Api.DTOs.Chat;

namespace EnglishApp.Api.Services.Interfaces;

public interface IChatService
{
    Task<IReadOnlyList<ChatScenarioDto>> GetScenariosAsync(CancellationToken ct = default);
    Task<ChatScenarioDto> CreateScenarioAsync(CreateScenarioRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<ChatSessionDto>> GetSessionsAsync(int userId, CancellationToken ct = default);
    Task<ChatSessionDto> CreateSessionAsync(int userId, CreateChatSessionRequest request, CancellationToken ct = default);
    Task<ChatSessionDetailDto> GetSessionAsync(int userId, long sessionId, CancellationToken ct = default);
    Task DeleteSessionAsync(int userId, long sessionId, CancellationToken ct = default);
    Task<SendMessageResult> SendMessageAsync(
        int userId, long sessionId, SendMessageRequest request, CancellationToken ct = default);
}
