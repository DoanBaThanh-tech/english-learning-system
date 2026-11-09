using EnglishApp.Api.Common.Utilities;
using EnglishApp.Api.Data;
using EnglishApp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EnglishApp.Api.Repositories.Specific;

public sealed class WordRepository : IWordRepository
{
    private readonly AppDbContext _db;

    public WordRepository(AppDbContext db) => _db = db;

    public Task<Word?> GetByLemmaAsync(string lemma, CancellationToken ct = default)
    {
        var normalized = TextUtil.Normalize(lemma);
        return _db.Words
            .Include(w => w.WordPronunciations)
            .Include(w => w.WordSenses).ThenInclude(s => s.PartOfSpeech)
            .Include(w => w.WordSenses).ThenInclude(s => s.Level)
            .Include(w => w.WordSenses).ThenInclude(s => s.SenseTranslations)
            .Include(w => w.WordSenses).ThenInclude(s => s.Examples)
            .FirstOrDefaultAsync(w => w.Lemma == normalized, ct);
    }

    public async Task<List<Word>> SearchAsync(string term, int limit, CancellationToken ct = default)
    {
        var normalized = TextUtil.Normalize(term);
        if (normalized.Length == 0)
        {
            return new List<Word>();
        }

        return await _db.Words
            .AsNoTracking()
            .Include(w => w.WordPronunciations)
            .Include(w => w.WordSenses).ThenInclude(s => s.PartOfSpeech)
            .Include(w => w.WordSenses).ThenInclude(s => s.Level)
            .Include(w => w.WordSenses).ThenInclude(s => s.SenseTranslations)
            .Where(w => w.Lemma.StartsWith(normalized))
            .OrderByDescending(w => w.Lemma == normalized)
            .ThenBy(w => w.Lemma)
            .Take(Math.Clamp(limit, 1, 30))
            .ToListAsync(ct);
    }

    public Task<WordSense?> GetSenseAsync(int senseId, CancellationToken ct = default) =>
        _db.WordSenses
            .AsNoTracking()
            .Include(s => s.Word)
            .Include(s => s.PartOfSpeech)
            .Include(s => s.Level)
            .Include(s => s.SenseTranslations)
            .Include(s => s.Examples)
            .FirstOrDefaultAsync(s => s.Id == senseId, ct);

    public Task<WordSense?> GetSenseWithWordAsync(int senseId, CancellationToken ct = default) =>
        _db.WordSenses
            .Include(s => s.Word)
            .Include(s => s.PartOfSpeech)
            .Include(s => s.SenseTranslations)
            .Include(s => s.Examples)
            .FirstOrDefaultAsync(s => s.Id == senseId, ct);

    public Task<List<Word>> ListWithSensesAsync(int limit, CancellationToken ct = default) =>
        _db.Words
            .AsNoTracking()
            .Include(w => w.WordPronunciations)
            .Include(w => w.WordSenses).ThenInclude(s => s.PartOfSpeech)
            .Include(w => w.WordSenses).ThenInclude(s => s.SenseTranslations)
            .Include(w => w.WordSenses).ThenInclude(s => s.Examples)
            .Where(w => w.WordSenses.Any())
            .OrderBy(w => w.Id)
            .Take(Math.Clamp(limit, 1, 500))
            .ToListAsync(ct);
}
