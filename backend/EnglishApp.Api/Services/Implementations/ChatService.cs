using EnglishApp.Api.Common.Exceptions;
using EnglishApp.Api.Common.Utilities;
using EnglishApp.Api.Data;
using EnglishApp.Api.DTOs.Chat;
using EnglishApp.Api.Models;
using EnglishApp.Api.Services.External;
using EnglishApp.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishApp.Api.Services.Implementations;

public sealed class ChatService : IChatService
{
    private readonly AppDbContext _db;
    private readonly IAiService _ai;
    private readonly ILogger<ChatService> _logger;

    public ChatService(AppDbContext db, IAiService ai, ILogger<ChatService> logger)
    {
        _db = db;
        _ai = ai;
        _logger = logger;
    }

    public async Task<IReadOnlyList<ChatScenarioDto>> GetScenariosAsync(CancellationToken ct = default) =>
        await _db.ChatScenarios
            .AsNoTracking()
            .Include(s => s.Level)
            .OrderBy(s => s.Id)
            .Select(s => new ChatScenarioDto(s.Id, s.LevelId, s.Level != null ? s.Level.Code : null, s.Name))
            .ToListAsync(ct);

    public async Task<ChatScenarioDto> CreateScenarioAsync(
        CreateScenarioRequest request, CancellationToken ct = default)
    {
        var name = request.Name.Trim();
        if (name.Length == 0) throw new BadRequestException("Tên kịch bản không được để trống.");

        if (request.LevelId is not null)
        {
            var levelOk = await _db.Levels.AnyAsync(l => l.Id == request.LevelId, ct);
            if (!levelOk) throw new BadRequestException("Trình độ không hợp lệ.");
        }

        var scenario = new ChatScenario
        {
            Name = TextUtil.Truncate(name, 100),
            SystemPrompt = request.SystemPrompt.Trim(),
            LevelId = request.LevelId
        };

        _db.ChatScenarios.Add(scenario);
        await _db.SaveChangesAsync(ct);

        var levelCode = request.LevelId is null
            ? null
            : await _db.Levels.Where(l => l.Id == request.LevelId).Select(l => l.Code).FirstOrDefaultAsync(ct);

        return new ChatScenarioDto(scenario.Id, scenario.LevelId, levelCode, scenario.Name);
    }

    public async Task<IReadOnlyList<ChatSessionDto>> GetSessionsAsync(
        int userId, CancellationToken ct = default)
    {
        var sessions = await _db.ChatSessions
            .AsNoTracking()
            .Include(s => s.Scenario)
            .Include(s => s.ChatMessages)
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .Take(50)
            .ToListAsync(ct);

        return sessions.Select(s =>
        {
            var last = s.ChatMessages.OrderByDescending(m => m.CreatedAt).FirstOrDefault();
            return new ChatSessionDto(
                s.Id,
                s.ScenarioId,
                s.Scenario?.Name,
                s.Title,
                s.CreatedAt,
                s.ChatMessages.Count,
                last?.Content,
                last?.CreatedAt);
        }).ToList();
    }

    public async Task<ChatSessionDto> CreateSessionAsync(
        int userId, CreateChatSessionRequest request, CancellationToken ct = default)
    {
        ChatScenario? scenario = null;
        if (request.ScenarioId is not null)
        {
            scenario = await _db.ChatScenarios
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == request.ScenarioId, ct)
                ?? throw new BadRequestException("Kịch bản không tồn tại.");
        }

        var session = new ChatSession
        {
            UserId = userId,
            ScenarioId = scenario?.Id,
            Title = TextUtil.Truncate(
                string.IsNullOrWhiteSpace(request.Title) ? scenario?.Name ?? "Hội thoại tự do" : request.Title,
                200),
            CreatedAt = DateTime.UtcNow
        };

        _db.ChatSessions.Add(session);
        await _db.SaveChangesAsync(ct);

        return new ChatSessionDto(
            session.Id, session.ScenarioId, scenario?.Name, session.Title, session.CreatedAt, 0, null, null);
    }

    public async Task<ChatSessionDetailDto> GetSessionAsync(
        int userId, long sessionId, CancellationToken ct = default)
    {
        var session = await _db.ChatSessions
            .AsNoTracking()
            .Include(s => s.Scenario)
            .Include(s => s.ChatMessages)
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId, ct)
            ?? throw new NotFoundException("Không tìm thấy cuộc hội thoại.");

        return new ChatSessionDetailDto(
            session.Id,
            session.ScenarioId,
            session.Scenario?.Name,
            session.Title,
            session.CreatedAt,
            session.ChatMessages.OrderBy(m => m.CreatedAt).Select(MapMessage).ToList());
    }

    public async Task DeleteSessionAsync(int userId, long sessionId, CancellationToken ct = default)
    {
        var session = await _db.ChatSessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId, ct)
            ?? throw new NotFoundException("Không tìm thấy cuộc hội thoại.");

        // LearnerErrors tham chiếu ChatMessage không có cascade, phải xóa trước
        // và xóa tường minh theo đúng thứ tự để tránh SQL Server chặn FK.
        await _db.LearnerErrors
            .Where(e => e.ChatMessageId != null &&
                        _db.ChatMessages.Any(m => m.SessionId == sessionId && m.Id == e.ChatMessageId))
            .ExecuteDeleteAsync(ct);

        await _db.ChatMessages
            .Where(m => m.SessionId == sessionId)
            .ExecuteDeleteAsync(ct);

        _db.ChatSessions.Remove(session);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<SendMessageResult> SendMessageAsync(
        int userId, long sessionId, SendMessageRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
        {
            throw new BadRequestException("Tin nhắn không được để trống.");
        }

        var session = await _db.ChatSessions
            .Include(s => s.Scenario)
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId, ct)
            ?? throw new NotFoundException("Không tìm thấy cuộc hội thoại.");

        var content = TextUtil.Truncate(request.Content.Trim(), 2000);
        var userMessage = new ChatMessage
        {
            SessionId = sessionId,
            Role = "user",
            Content = content,
            CreatedAt = DateTime.UtcNow
        };

        _db.ChatMessages.Add(userMessage);
        await _db.SaveChangesAsync(ct);

        var previous = await _db.ChatMessages
            .AsNoTracking()
            .Where(m => m.SessionId == sessionId && m.Id != userMessage.Id)
            .OrderByDescending(m => m.CreatedAt)
            .Take(10)
            .ToListAsync(ct);

        previous.Reverse();

        var history = previous
            .Select(m => new AiTurn(m.Role, m.Content))
            .ToList();

        var systemPrompt = BuildSystemPrompt(session.Scenario);
        var aiResult = await _ai.ChatAsync(systemPrompt, history, content, ct);

        string reply;
        string? corrected;
        List<CorrectionDto> corrections;
        var aiUsed = aiResult is not null;

        if (aiResult is not null)
        {
            reply = aiResult.Reply;
            corrected = aiResult.Corrected;
            corrections = aiResult.Corrections
                .Select(c => new CorrectionDto(c.Original, c.Correction, c.Explanation))
                .Take(8)
                .ToList();
        }
        else
        {
            var fallback = TutorFallback.Correct(content);
            reply = TutorFallback.Reply(session.Scenario?.Name, fallback.Corrected, previous.Count + 1);
            corrected = string.Equals(fallback.Corrected, content, StringComparison.Ordinal)
                ? null
                : fallback.Corrected;
            corrections = fallback.Corrections
                .Select(c => new CorrectionDto(c.Original, c.Correction, c.Explanation))
                .ToList();
        }

        if (!string.IsNullOrWhiteSpace(corrected))
        {
            userMessage.CorrectedContent = TextUtil.Truncate(corrected, 4000);
        }

        var assistantMessage = new ChatMessage
        {
            SessionId = sessionId,
            Role = "assistant",
            Content = TextUtil.Truncate(reply, 4000),
            CreatedAt = DateTime.UtcNow.AddMilliseconds(1)
        };

        _db.ChatMessages.Add(assistantMessage);
        await _db.SaveChangesAsync(ct);

        if (corrections.Count > 0)
        {
            var grammarSkillId = await _db.Skills
                .Where(s => s.Code == "grammar")
                .Select(s => s.Id)
                .FirstAsync(ct);

            foreach (var correction in corrections.Take(5))
            {
                _db.LearnerErrors.Add(new LearnerError
                {
                    UserId = userId,
                    SkillId = grammarSkillId,
                    ChatMessageId = userMessage.Id,
                    Detail = TextUtil.Truncate(
                        $"'{correction.Original}' → nên dùng '{correction.Correction}'.", 500),
                    Correction = TextUtil.Truncate(correction.Explanation, 500),
                    IsResolved = false,
                    CreatedAt = DateTime.UtcNow
                });
            }

            await _db.SaveChangesAsync(ct);
        }

        var now = DateTime.UtcNow;
        var suggested = await _db.UserWords
            .AsNoTracking()
            .Where(uw => uw.UserId == userId && uw.SrsState != null && uw.SrsState.DueAt <= now)
            .OrderBy(uw => uw.SrsState!.DueAt)
            .Select(uw => uw.Sense.Word.Lemma)
            .Distinct()
            .Take(4)
            .ToListAsync(ct);

        if (suggested.Count == 0)
        {
            suggested = await _db.UserWords
                .AsNoTracking()
                .Where(uw => uw.UserId == userId)
                .OrderByDescending(uw => uw.AddedAt)
                .Select(uw => uw.Sense.Word.Lemma)
                .Distinct()
                .Take(4)
                .ToListAsync(ct);
        }

        if (!aiUsed)
        {
            _logger.LogInformation("Chat used offline tutor for session {SessionId}", sessionId);
        }

        return new SendMessageResult(
            MapMessage(userMessage),
            MapMessage(assistantMessage),
            corrections,
            suggested,
            aiUsed);
    }

    private static string BuildSystemPrompt(ChatScenario? scenario)
    {
        var scenarioPrompt = scenario?.SystemPrompt
                             ?? "You are a friendly English conversation partner for a Vietnamese learner. " +
                                "Keep replies short, natural, and end with one question.";

        return scenarioPrompt +
               "\nThe learner is Vietnamese. Correct only important grammar or word-choice errors. " +
               "Use English for the role-play and add a short Vietnamese hint only when it helps.";
    }

    private static ChatMessageDto MapMessage(ChatMessage message) => new(
        message.Id,
        message.Role,
        message.Content,
        message.CorrectedContent,
        message.CreatedAt);
}
