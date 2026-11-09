using EnglishApp.Api.Common.Exceptions;
using EnglishApp.Api.Data;
using EnglishApp.Api.DTOs.Errors;
using EnglishApp.Api.Models;
using EnglishApp.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishApp.Api.Services.Implementations;

public sealed class ErrorService : IErrorService
{
    private readonly AppDbContext _db;

    public ErrorService(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<LearnerErrorDto>> ListAsync(
        int userId, bool? resolved, byte? skillId, int limit, CancellationToken ct = default)
    {
        var query = _db.LearnerErrors
            .AsNoTracking()
            .Include(e => e.Skill)
            .Where(e => e.UserId == userId);

        if (resolved is not null) query = query.Where(e => e.IsResolved == resolved);
        if (skillId is not null) query = query.Where(e => e.SkillId == skillId);

        var errors = await query
            .OrderByDescending(e => e.CreatedAt)
            .Take(Math.Clamp(limit, 1, 200))
            .ToListAsync(ct);

        return errors.Select(Map).ToList();
    }

    public async Task<LearnerErrorDto> ResolveAsync(
        int userId, long id, bool resolved, CancellationToken ct = default)
    {
        var error = await _db.LearnerErrors
            .Include(e => e.Skill)
            .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId, ct)
            ?? throw new NotFoundException("Không tìm thấy lỗi.");

        error.IsResolved = resolved;
        await _db.SaveChangesAsync(ct);
        return Map(error);
    }

    public async Task RemoveAsync(int userId, long id, CancellationToken ct = default)
    {
        var error = await _db.LearnerErrors
            .FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId, ct)
            ?? throw new NotFoundException("Không tìm thấy lỗi.");

        _db.LearnerErrors.Remove(error);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<ErrorSummaryDto> SummaryAsync(int userId, CancellationToken ct = default)
    {
        var errors = await _db.LearnerErrors
            .AsNoTracking()
            .Include(e => e.Skill)
            .Where(e => e.UserId == userId)
            .OrderByDescending(e => e.CreatedAt)
            .ToListAsync(ct);

        var groups = errors
            .GroupBy(e => new { e.SkillId, e.Skill.Code, e.Skill.NameVi })
            .Select(g => new ErrorGroupDto(
                g.Key.Code,
                g.Key.NameVi,
                g.Count(),
                g.Count(e => !e.IsResolved)))
            .OrderByDescending(g => g.Count)
            .ToList();

        return new ErrorSummaryDto(
            errors.Count,
            errors.Count(e => !e.IsResolved),
            groups,
            errors.Take(8).Select(Map).ToList());
    }

    private static LearnerErrorDto Map(LearnerError error)
    {
        var source = error.PronunciationAttemptId is not null
            ? "pronunciation"
            : error.ChatMessageId is not null ? "chat" : "study";

        var referenceId = error.PronunciationAttemptId
                          ?? error.ChatMessageId
                          ?? error.StudyAnswerId;

        return new LearnerErrorDto(
            error.Id,
            error.SkillId,
            error.Skill?.Code ?? string.Empty,
            error.Skill?.NameVi ?? string.Empty,
            error.Detail,
            error.Correction,
            error.IsResolved,
            error.CreatedAt,
            source,
            referenceId);
    }
}
