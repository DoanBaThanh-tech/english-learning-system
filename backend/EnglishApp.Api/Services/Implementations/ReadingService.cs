using System.Text.RegularExpressions;
using EnglishApp.Api.Common.Exceptions;
using EnglishApp.Api.Common.Utilities;
using EnglishApp.Api.Data;
using EnglishApp.Api.DTOs.Reading;
using EnglishApp.Api.Models;
using EnglishApp.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishApp.Api.Services.Implementations;

public sealed class ReadingService : IReadingService
{
    private static readonly Regex TokenRegex = new(@"[A-Za-z][A-Za-z'\-]*", RegexOptions.Compiled);

    private readonly AppDbContext _db;

    public ReadingService(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<PassageSummaryDto>> ListAsync(
        int userId, byte? levelId, string? topic, CancellationToken ct = default)
    {
        var query = _db.ReadingPassages
            .AsNoTracking()
            .Include(p => p.Level)
            .AsQueryable();

        if (levelId is not null) query = query.Where(p => p.LevelId == levelId);
        if (!string.IsNullOrWhiteSpace(topic))
        {
            var term = topic.Trim();
            query = query.Where(p => p.Topic != null && p.Topic.Contains(term));
        }

        var passages = await query.OrderBy(p => p.LevelId).ThenBy(p => p.Id).ToListAsync(ct);
        var progress = await _db.UserPassageProgresses
            .AsNoTracking()
            .Where(p => p.UserId == userId)
            .ToDictionaryAsync(p => p.PassageId, ct);

        return passages.Select(p =>
        {
            progress.TryGetValue(p.Id, out var item);
            return new PassageSummaryDto(
                p.Id,
                p.Title,
                p.Topic,
                p.LevelId,
                p.Level.Code,
                p.Level.Name,
                TextUtil.Tokenize(p.Body).Count,
                item?.ProgressPct ?? 0,
                item?.LastReadAt,
                p.SourceId);
        }).ToList();
    }

    public async Task<PassageDetailDto> GetAsync(int userId, int id, CancellationToken ct = default)
    {
        var passage = await _db.ReadingPassages
            .AsNoTracking()
            .Include(p => p.Level)
            .FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw new NotFoundException("Không tìm thấy bài đọc.");

        var progress = await _db.UserPassageProgresses
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId && p.PassageId == id, ct);

        return new PassageDetailDto(
            passage.Id,
            passage.Title,
            passage.Topic,
            passage.LevelId,
            passage.Level.Code,
            passage.Level.Name,
            passage.Body,
            TextUtil.Tokenize(passage.Body).Count,
            progress?.ProgressPct ?? 0,
            progress?.LastReadAt,
            passage.SourceId);
    }

    public async Task<PassageDetailDto> CreateAsync(
        int userId, CreatePassageRequest request, CancellationToken ct = default)
    {
        await ValidateLevelAsync(request.LevelId, ct);
        await ValidateSourceAsync(userId, request.SourceId, ct);

        var passage = new ReadingPassage
        {
            Title = TextUtil.Truncate(request.Title.Trim(), 300),
            Topic = string.IsNullOrWhiteSpace(request.Topic) ? null : TextUtil.Truncate(request.Topic.Trim(), 100),
            LevelId = request.LevelId,
            Body = request.Body.Trim(),
            SourceId = request.SourceId
        };

        _db.ReadingPassages.Add(passage);
        await _db.SaveChangesAsync(ct);

        return await GetAsync(userId, passage.Id, ct);
    }

    public async Task<PassageDetailDto> UpdateAsync(
        int userId, int id, UpdatePassageRequest request, CancellationToken ct = default)
    {
        var passage = await _db.ReadingPassages.FirstOrDefaultAsync(p => p.Id == id, ct)
                      ?? throw new NotFoundException("Không tìm thấy bài đọc.");

        await ValidateLevelAsync(request.LevelId, ct);
        await ValidateSourceAsync(userId, request.SourceId, ct);

        passage.Title = TextUtil.Truncate(request.Title.Trim(), 300);
        passage.Topic = string.IsNullOrWhiteSpace(request.Topic) ? null : TextUtil.Truncate(request.Topic.Trim(), 100);
        passage.LevelId = request.LevelId;
        passage.Body = request.Body.Trim();
        passage.SourceId = request.SourceId;

        await _db.SaveChangesAsync(ct);
        return await GetAsync(userId, id, ct);
    }

    public async Task DeleteAsync(int userId, int id, CancellationToken ct = default)
    {
        var passage = await _db.ReadingPassages.FirstOrDefaultAsync(p => p.Id == id, ct)
                      ?? throw new NotFoundException("Không tìm thấy bài đọc.");

        var tasks = await _db.PlanTasks.Where(t => t.PassageId == id).ToListAsync(ct);
        foreach (var task in tasks) task.PassageId = null;

        _db.ReadingPassages.Remove(passage);
        await _db.SaveChangesAsync(ct);
    }

    public async Task UpdateProgressAsync(
        int userId, int id, byte progressPct, CancellationToken ct = default)
    {
        var exists = await _db.ReadingPassages.AnyAsync(p => p.Id == id, ct);
        if (!exists) throw new NotFoundException("Không tìm thấy bài đọc.");

        var progress = await _db.UserPassageProgresses
            .FirstOrDefaultAsync(p => p.UserId == userId && p.PassageId == id, ct);

        if (progress is null)
        {
            progress = new UserPassageProgress { UserId = userId, PassageId = id };
            _db.UserPassageProgresses.Add(progress);
        }

        progress.ProgressPct = (byte)Math.Clamp((int)progressPct, 0, 100);
        progress.LastReadAt = DateTime.UtcNow;

        await _db.SaveChangesAsync(ct);
    }

    public async Task<PassageLensDto> GetLensAsync(int userId, int id, CancellationToken ct = default)
    {
        var passage = await _db.ReadingPassages
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.Id == id, ct)
            ?? throw new NotFoundException("Không tìm thấy bài đọc.");

        var saved = await _db.UserWords
            .AsNoTracking()
            .Where(uw => uw.UserId == userId)
            .Select(uw => new SavedWord(
                uw.Id,
                uw.Sense.WordId,
                uw.Sense.Word.Lemma,
                uw.Sense.SenseTranslations
                    .OrderByDescending(t => t.IsVerified)
                    .Select(t => t.MeaningVi)
                    .FirstOrDefault()))
            .ToListAsync(ct);

        var byLemma = saved
            .GroupBy(s => s.Lemma)
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);

        var segments = new List<LensSegmentDto>();
        var matches = TokenRegex.Matches(passage.Body);
        var cursor = 0;
        var savedIds = new HashSet<int>();

        foreach (Match match in matches)
        {
            if (match.Index > cursor)
            {
                segments.Add(new LensSegmentDto(passage.Body[cursor..match.Index], false, null, null, null));
            }

            var token = match.Value;
            SavedWord? found = null;
            foreach (var candidate in TextUtil.LemmaCandidates(token))
            {
                if (byLemma.TryGetValue(candidate, out var value))
                {
                    found = value;
                    break;
                }
            }

            if (found is not null)
            {
                savedIds.Add(found.UserWordId);
                segments.Add(new LensSegmentDto(
                    token, true, found.WordId, found.UserWordId, found.Meaning));
            }
            else
            {
                segments.Add(new LensSegmentDto(token, true, null, null, null));
            }

            cursor = match.Index + match.Length;
        }

        if (cursor < passage.Body.Length)
        {
            segments.Add(new LensSegmentDto(passage.Body[cursor..], false, null, null, null));
        }

        return new PassageLensDto(passage.Id, passage.Title, segments, savedIds.Count);
    }

    private sealed record SavedWord(int UserWordId, int WordId, string Lemma, string? Meaning);

    private async Task ValidateLevelAsync(byte levelId, CancellationToken ct)
    {
        if (!await _db.Levels.AnyAsync(l => l.Id == levelId, ct))
        {
            throw new BadRequestException("Trình độ không hợp lệ.");
        }
    }

    private async Task ValidateSourceAsync(int userId, int? sourceId, CancellationToken ct)
    {
        if (sourceId is null) return;
        if (!await _db.Sources.AnyAsync(s => s.Id == sourceId && s.UserId == userId, ct))
        {
            throw new BadRequestException("Nguồn tài liệu không hợp lệ.");
        }
    }
}
