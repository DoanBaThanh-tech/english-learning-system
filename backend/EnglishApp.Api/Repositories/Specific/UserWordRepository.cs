using EnglishApp.Api.Common.Utilities;
using EnglishApp.Api.Data;
using EnglishApp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EnglishApp.Api.Repositories.Specific;

public sealed class UserWordRepository : IUserWordRepository
{
    private readonly AppDbContext _db;

    public UserWordRepository(AppDbContext db) => _db = db;

    private IQueryable<UserWord> BaseQuery() =>
        _db.UserWords
            .Include(uw => uw.Sense).ThenInclude(s => s.Word).ThenInclude(w => w.WordPronunciations)
            .Include(uw => uw.Sense).ThenInclude(s => s.PartOfSpeech)
            .Include(uw => uw.Sense).ThenInclude(s => s.SenseTranslations)
            .Include(uw => uw.Sense).ThenInclude(s => s.Examples)
            .Include(uw => uw.Folder)
            .Include(uw => uw.Tags)
            .Include(uw => uw.SrsState);

    public Task<UserWord?> GetDetailAsync(int userWordId, int userId, CancellationToken ct = default) =>
        BaseQuery().FirstOrDefaultAsync(uw => uw.Id == userWordId && uw.UserId == userId, ct);

    public Task<List<UserWord>> GetDueAsync(int userId, int limit, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        return BaseQuery()
            .Where(uw => uw.UserId == userId && uw.SrsState != null && uw.SrsState.DueAt <= now)
            .OrderBy(uw => uw.SrsState!.DueAt)
            .Take(Math.Clamp(limit, 1, 100))
            .ToListAsync(ct);
    }

    public Task<List<UserWord>> GetNewAsync(int userId, int limit, CancellationToken ct = default) =>
        BaseQuery()
            .Where(uw => uw.UserId == userId && uw.Status == "new")
            .OrderBy(uw => uw.AddedAt)
            .Take(Math.Clamp(limit, 1, 100))
            .ToListAsync(ct);

    public async Task<(List<UserWord> Items, int Total)> ListAsync(
        int userId, int? folderId, int? tagId, string? status, string? search,
        int page, int pageSize, CancellationToken ct = default)
    {
        var query = BaseQuery().Where(uw => uw.UserId == userId);

        if (folderId is not null) query = query.Where(uw => uw.FolderId == folderId);
        if (tagId is not null) query = query.Where(uw => uw.Tags.Any(t => t.Id == tagId));
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(uw => uw.Status == status);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = TextUtil.Normalize(search);
            query = query.Where(uw =>
                uw.Sense.Word.Lemma.Contains(term) ||
                uw.Sense.SenseTranslations.Any(t => t.MeaningVi.Contains(term)) ||
                (uw.Note != null && uw.Note.Contains(term)));
        }

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(uw => uw.AddedAt)
            .Skip((Math.Max(page, 1) - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        return (items, total);
    }

    public Task<int> CountAsync(int userId, CancellationToken ct = default) =>
        _db.UserWords.CountAsync(uw => uw.UserId == userId, ct);

    public Task<int> CountDueAsync(int userId, CancellationToken ct = default)
    {
        var now = DateTime.UtcNow;
        return _db.SrsStates.CountAsync(s => s.UserWord.UserId == userId && s.DueAt <= now, ct);
    }
}
