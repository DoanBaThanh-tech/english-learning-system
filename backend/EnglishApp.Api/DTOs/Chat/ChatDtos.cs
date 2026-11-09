using System.ComponentModel.DataAnnotations;

namespace EnglishApp.Api.DTOs.Chat;

public sealed record ChatScenarioDto(
    int Id,
    byte? LevelId,
    string? LevelCode,
    string Name);

public sealed record CreateChatSessionRequest(int? ScenarioId, [MaxLength(200)] string? Title);

public sealed record ChatSessionDto(
    long Id,
    int? ScenarioId,
    string? ScenarioName,
    string? Title,
    DateTime CreatedAt,
    int MessageCount,
    string? LastMessage,
    DateTime? LastMessageAt);

public sealed record ChatMessageDto(
    long Id,
    string Role,
    string Content,
    string? CorrectedContent,
    DateTime CreatedAt);

public sealed record ChatSessionDetailDto(
    long Id,
    int? ScenarioId,
    string? ScenarioName,
    string? Title,
    DateTime CreatedAt,
    IReadOnlyList<ChatMessageDto> Messages);

public sealed record SendMessageRequest([Required, MaxLength(2000)] string Content);

public sealed record CorrectionDto(string Original, string Correction, string Explanation);

public sealed record SendMessageResult(
    ChatMessageDto UserMessage,
    ChatMessageDto AssistantMessage,
    IReadOnlyList<CorrectionDto> Corrections,
    IReadOnlyList<string> SuggestedWords,
    bool AiUsed);

public sealed record CreateScenarioRequest(
    [Required, MaxLength(100)] string Name,
    [Required] string SystemPrompt,
    byte? LevelId = null);
