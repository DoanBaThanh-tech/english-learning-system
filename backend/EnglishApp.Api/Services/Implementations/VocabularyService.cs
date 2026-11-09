using EnglishApp.Api.Common.Exceptions;
using EnglishApp.Api.Common.Utilities;
using EnglishApp.Api.Data;
using EnglishApp.Api.DTOs.Dictionary;
using EnglishApp.Api.DTOs.Vocabulary;
using EnglishApp.Api.Models;
using EnglishApp.Api.Repositories.Specific;
using EnglishApp.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishApp.Api.Services.Implementations;

public sealed class VocabularyService : IVocabularyService
{
    private readonly AppDbContext _db;
    private readonly IUserWordRepository _userWords;
    private readonly IDictionaryService _dictionary;

    public VocabularyService(AppDbContext db, IUserWordRepository userWords, IDictionaryService dictionary)
    {
        _db = db;
        _userWords = userWords;
        _dictionary = dictionary;
    }

    public async Task<PagedResult<UserWordDto>> ListAsync(
        int userId, int? folderId, int? tagId, string? status, string? search,
        int page, int pageSize, CancellationToken ct = default)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 100);

        if (!string.IsNullOrWhiteSpace(status) && status is not ("new" or "learning" or "mastered"))
        {
            throw new BadRequestException("Trạng thái chỉ có thể là new, learning hoặc mastered.");
        }

        var (items, total) = await _userWords.ListAsync(userId, folderId, tagId, status, search, page, pageSize, ct);
        return new PagedResult<UserWordDto>(items.Select(Map).ToList(), page, pageSize, total);
    }

    public async Task<UserWordDto> GetAsync(int userId, int userWordId, CancellationToken ct = default)
    {
        var userWord = await _userWords.GetDetailAsync(userWordId, userId, ct)
                       ?? throw new NotFoundException("Không tìm thấy từ trong sổ của bạn.");
        return Map(userWord);
    }

    public async Task<VocabularyStatsDto> GetStatsAsync(int userId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        var total = await _db.UserWords.CountAsync(uw => uw.UserId == userId, ct);
        var newCount = await _db.UserWords.CountAsync(uw => uw.UserId == userId && uw.Status == "new", ct);
        var learning = await _db.UserWords.CountAsync(uw => uw.UserId == userId && uw.Status == "learning", ct);
        var mastered = await _db.UserWords.CountAsync(uw => uw.UserId == userId && uw.Status == "mastered", ct);
        var due = await _db.SrsStates.CountAsync(s => s.UserWord.UserId == userId && s.DueAt <= now, ct);
        var folders = await _db.WordFolders.CountAsync(f => f.UserId == userId, ct);
        var tags = await _db.Tags.CountAsync(t => t.UserId == userId, ct);

        return new VocabularyStatsDto(total, newCount, learning, mastered, due, folders, tags);
    }

    public async Task<IReadOnlyList<UserWordDto>> GetDueAsync(
        int userId, int limit, CancellationToken ct = default)
    {
        var words = await _userWords.GetDueAsync(userId, limit, ct);
        return words.Select(Map).ToList();
    }

    public async Task<UserWordDto> AddAsync(int userId, AddUserWordRequest request, CancellationToken ct = default)
    {
        var sense = await _db.WordSenses
            .AsNoTracking()
            .Include(s => s.Word)
            .FirstOrDefaultAsync(s => s.Id == request.SenseId, ct)
            ?? throw new NotFoundException("Nghĩa của từ không tồn tại.");

        var existing = await _db.UserWords
            .FirstOrDefaultAsync(uw => uw.UserId == userId && uw.SenseId == sense.Id, ct);

        if (existing is not null)
        {
            var detail = await _userWords.GetDetailAsync(existing.Id, userId, ct);
            return Map(detail!);
        }

        if (request.FolderId is not null)
        {
            await EnsureFolderAsync(userId, request.FolderId.Value, ct);
        }

        if (request.SourceId is not null)
        {
            var sourceOk = await _db.Sources.AnyAsync(s => s.Id == request.SourceId && s.UserId == userId, ct);
            if (!sourceOk) throw new BadRequestException("Nguồn tài liệu không hợp lệ.");
        }

        var tags = await LoadOwnedTagsAsync(userId, request.TagIds, ct);

        var userWord = new UserWord
        {
            UserId = userId,
            SenseId = sense.Id,
            FolderId = request.FolderId,
            SourceId = request.SourceId,
            ContextSentence = TextUtil.Truncate(request.ContextSentence, 1000),
            Note = TextUtil.Truncate(request.Note, 500),
            Status = "new",
            AddedAt = DateTime.UtcNow,
            SrsState = new SrsState
            {
                DueAt = DateTime.UtcNow,
                IntervalDays = 0,
                Repetitions = 0,
                EaseFactor = 2.5m
            }
        };

        foreach (var tag in tags) userWord.Tags.Add(tag);

        _db.UserWords.Add(userWord);
        await _db.SaveChangesAsync(ct);

        var created = await _userWords.GetDetailAsync(userWord.Id, userId, ct);
        return Map(created!);
    }

    public async Task<UserWordDto> AddByLemmaAsync(
        int userId, AddWordByLemmaRequest request, CancellationToken ct = default)
    {
        var word = await _dictionary.GetWordAsync(userId, request.Lemma, ct);
        if (word.Senses.Count == 0)
        {
            throw new NotFoundException("Từ này chưa có nghĩa để lưu.");
        }

        var senseId = word.Senses[0].Id;

        if (!string.IsNullOrWhiteSpace(request.ContextSentence))
        {
            var lookup = await _dictionary.ContextLookupAsync(
                userId,
                new ContextLookupRequest(request.Lemma, request.ContextSentence),
                ct);

            if (lookup.ChosenSenseId is not null)
            {
                senseId = lookup.ChosenSenseId.Value;
            }
        }

        return await AddAsync(userId, new AddUserWordRequest(
            senseId,
            request.FolderId,
            null,
            request.ContextSentence,
            request.Note,
            request.TagIds), ct);
    }

    public async Task<UserWordDto> UpdateAsync(
        int userId, int userWordId, UpdateUserWordRequest request, CancellationToken ct = default)
    {
        var userWord = await _db.UserWords
            .Include(uw => uw.Tags)
            .FirstOrDefaultAsync(uw => uw.Id == userWordId && uw.UserId == userId, ct)
            ?? throw new NotFoundException("Không tìm thấy từ trong sổ của bạn.");

        if (request.FolderId is not null)
        {
            await EnsureFolderAsync(userId, request.FolderId.Value, ct);
        }

        userWord.FolderId = request.FolderId;
        userWord.Note = string.IsNullOrWhiteSpace(request.Note) ? null : TextUtil.Truncate(request.Note, 500);

        if (!string.IsNullOrWhiteSpace(request.Status))
        {
            if (request.Status is not ("new" or "learning" or "mastered"))
            {
                throw new BadRequestException("Trạng thái chỉ có thể là new, learning hoặc mastered.");
            }

            userWord.Status = request.Status;
        }

        if (request.TagIds is not null)
        {
            var tags = await LoadOwnedTagsAsync(userId, request.TagIds, ct);
            userWord.Tags.Clear();
            foreach (var tag in tags) userWord.Tags.Add(tag);
        }

        await _db.SaveChangesAsync(ct);

        var updated = await _userWords.GetDetailAsync(userWordId, userId, ct);
        return Map(updated!);
    }

    public async Task RemoveAsync(int userId, int userWordId, CancellationToken ct = default)
    {
        var userWord = await _db.UserWords
            .FirstOrDefaultAsync(uw => uw.Id == userWordId && uw.UserId == userId, ct)
            ?? throw new NotFoundException("Không tìm thấy từ trong sổ của bạn.");

        // Giữ toàn vẹn dữ liệu: xóa lỗi -> review log -> study answer trước khi xóa UserWord.
        var answerIds = await _db.StudyAnswers
            .Where(a => a.UserWordId == userWordId)
            .Select(a => a.Id)
            .ToListAsync(ct);

        if (answerIds.Count > 0)
        {
            var errors = await _db.LearnerErrors
                .Where(e => e.StudyAnswerId != null && answerIds.Contains(e.StudyAnswerId.Value))
                .ToListAsync(ct);
            _db.LearnerErrors.RemoveRange(errors);

            var reviewLogs = await _db.ReviewLogs
                .Where(r => r.StudyAnswerId != null && answerIds.Contains(r.StudyAnswerId.Value))
                .ToListAsync(ct);
            _db.ReviewLogs.RemoveRange(reviewLogs);

            var answers = await _db.StudyAnswers.Where(a => a.UserWordId == userWordId).ToListAsync(ct);
            _db.StudyAnswers.RemoveRange(answers);
        }

        _db.UserWords.Remove(userWord);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<FolderDto>> GetFoldersAsync(int userId, CancellationToken ct = default) =>
        await _db.WordFolders
            .AsNoTracking()
            .Where(f => f.UserId == userId)
            .OrderBy(f => f.Name)
            .Select(f => new FolderDto(f.Id, f.Name, f.UserWords.Count))
            .ToListAsync(ct);

    public async Task<FolderDto> CreateFolderAsync(int userId, string name, CancellationToken ct = default)
    {
        var clean = CleanName(name, 100);
        if (await _db.WordFolders.AnyAsync(f => f.UserId == userId && f.Name == clean, ct))
        {
            throw new ConflictException("Tên thư mục đã tồn tại.");
        }

        var folder = new WordFolder { UserId = userId, Name = clean };
        _db.WordFolders.Add(folder);
        await _db.SaveChangesAsync(ct);
        return new FolderDto(folder.Id, folder.Name, 0);
    }

    public async Task<FolderDto> UpdateFolderAsync(
        int userId, int folderId, string name, CancellationToken ct = default)
    {
        var clean = CleanName(name, 100);
        var folder = await _db.WordFolders
            .FirstOrDefaultAsync(f => f.Id == folderId && f.UserId == userId, ct)
            ?? throw new NotFoundException("Không tìm thấy thư mục.");

        if (await _db.WordFolders.AnyAsync(f => f.UserId == userId && f.Name == clean && f.Id != folderId, ct))
        {
            throw new ConflictException("Tên thư mục đã tồn tại.");
        }

        folder.Name = clean;
        await _db.SaveChangesAsync(ct);

        var count = await _db.UserWords.CountAsync(uw => uw.FolderId == folderId, ct);
        return new FolderDto(folder.Id, folder.Name, count);
    }

    public async Task DeleteFolderAsync(int userId, int folderId, CancellationToken ct = default)
    {
        var folder = await _db.WordFolders
            .Include(f => f.UserWords)
            .FirstOrDefaultAsync(f => f.Id == folderId && f.UserId == userId, ct)
            ?? throw new NotFoundException("Không tìm thấy thư mục.");

        foreach (var word in folder.UserWords)
        {
            word.FolderId = null;
        }

        _db.WordFolders.Remove(folder);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<IReadOnlyList<TagDto>> GetTagsAsync(int userId, CancellationToken ct = default) =>
        await _db.Tags
            .AsNoTracking()
            .Where(t => t.UserId == userId)
            .OrderBy(t => t.Name)
            .Select(t => new TagDto(t.Id, t.Name, t.UserWords.Count))
            .ToListAsync(ct);

    public async Task<TagDto> CreateTagAsync(int userId, string name, CancellationToken ct = default)
    {
        var clean = CleanName(name, 50);
        if (await _db.Tags.AnyAsync(t => t.UserId == userId && t.Name == clean, ct))
        {
            throw new ConflictException("Nhãn này đã tồn tại.");
        }

        var tag = new Tag { UserId = userId, Name = clean };
        _db.Tags.Add(tag);
        await _db.SaveChangesAsync(ct);
        return new TagDto(tag.Id, tag.Name, 0);
    }

    public async Task<TagDto> UpdateTagAsync(int userId, int tagId, string name, CancellationToken ct = default)
    {
        var clean = CleanName(name, 50);
        var tag = await _db.Tags
            .FirstOrDefaultAsync(t => t.Id == tagId && t.UserId == userId, ct)
            ?? throw new NotFoundException("Không tìm thấy nhãn.");

        if (await _db.Tags.AnyAsync(t => t.UserId == userId && t.Name == clean && t.Id != tagId, ct))
        {
            throw new ConflictException("Nhãn này đã tồn tại.");
        }

        tag.Name = clean;
        await _db.SaveChangesAsync(ct);

        var count = await _db.UserWords.CountAsync(uw => uw.Tags.Any(t => t.Id == tagId), ct);
        return new TagDto(tag.Id, tag.Name, count);
    }

    public async Task DeleteTagAsync(int userId, int tagId, CancellationToken ct = default)
    {
        var tag = await _db.Tags
            .Include(t => t.UserWords)
            .FirstOrDefaultAsync(t => t.Id == tagId && t.UserId == userId, ct)
            ?? throw new NotFoundException("Không tìm thấy nhãn.");

        tag.UserWords.Clear();
        _db.Tags.Remove(tag);
        await _db.SaveChangesAsync(ct);
    }

    private async Task EnsureFolderAsync(int userId, int folderId, CancellationToken ct)
    {
        var exists = await _db.WordFolders.AnyAsync(f => f.Id == folderId && f.UserId == userId, ct);
        if (!exists) throw new BadRequestException("Thư mục không hợp lệ.");
    }

    private async Task<List<Tag>> LoadOwnedTagsAsync(
        int userId, IReadOnlyList<int>? tagIds, CancellationToken ct)
    {
        if (tagIds is null || tagIds.Count == 0) return new List<Tag>();

        var distinct = tagIds.Distinct().ToList();
        var tags = await _db.Tags
            .Where(t => distinct.Contains(t.Id) && t.UserId == userId)
            .ToListAsync(ct);

        if (tags.Count != distinct.Count)
        {
            throw new BadRequestException("Có nhãn không hợp lệ.");
        }

        return tags;
    }

    private static string CleanName(string name, int maxLength)
    {
        var clean = (name ?? string.Empty).Trim();
        if (clean.Length == 0) throw new BadRequestException("Tên không được để trống.");
        return TextUtil.Truncate(clean, maxLength);
    }

    private static UserWordDto Map(UserWord uw)
    {
        var sense = uw.Sense;
        var meaning = sense.SenseTranslations
            .OrderByDescending(t => t.IsVerified)
            .Select(t => t.MeaningVi)
            .FirstOrDefault() ?? TextUtil.SimplifyMeaning(sense.DefinitionEn);

        var us = sense.Word.WordPronunciations.FirstOrDefault(p => p.Accent == "US");

        return new UserWordDto(
            uw.Id,
            uw.SenseId,
            sense.WordId,
            sense.Word.Lemma,
            us?.Ipa,
            us?.AudioUrl,
            meaning,
            sense.DefinitionEn,
            sense.PartOfSpeech?.Code ?? "phrase",
            sense.Level?.Code,
            uw.ContextSentence,
            uw.Note,
            uw.Status,
            uw.FolderId,
            uw.Folder?.Name,
            uw.Tags.Select(t => new TagDto(t.Id, t.Name, 0)).ToList(),
            uw.SrsState is null
                ? null
                : new SrsDto(
                    uw.SrsState.DueAt,
                    uw.SrsState.IntervalDays,
                    uw.SrsState.Repetitions,
                    uw.SrsState.EaseFactor,
                    uw.SrsState.DueAt <= DateTime.UtcNow),
            uw.AddedAt);
    }
}
