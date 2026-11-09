using EnglishApp.Api.Common.Exceptions;
using EnglishApp.Api.Common.Utilities;
using EnglishApp.Api.Data;
using EnglishApp.Api.DTOs.Lessons;
using EnglishApp.Api.Models;
using EnglishApp.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishApp.Api.Services.Implementations;

/// <summary>
/// Quản lý nguồn học (web/text/video/document) và sinh bài học từ tần suất từ.
/// Từ đã có trong DB curated được xử lý offline; từ lạ chỉ bổ sung tối đa 5 từ/nguồn
/// để tránh gọi API ngoài quá lâu.
/// </summary>
public sealed class SourceLessonService : ISourceLessonService
{
    private const int MaxUnknownEnrich = 5;

    private readonly AppDbContext _db;
    private readonly IDictionaryService _dictionary;
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly ILogger<SourceLessonService> _logger;

    public SourceLessonService(
        AppDbContext db,
        IDictionaryService dictionary,
        IHttpClientFactory httpClientFactory,
        ILogger<SourceLessonService> logger)
    {
        _db = db;
        _dictionary = dictionary;
        _httpClientFactory = httpClientFactory;
        _logger = logger;
    }

    public async Task<IReadOnlyList<SourceDto>> ListSourcesAsync(
        int userId, CancellationToken ct = default)
    {
        var sources = await _db.Sources
            .AsNoTracking()
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new { Source = s, LessonCount = s.GeneratedLessons.Count })
            .ToListAsync(ct);

        return sources.Select(x => MapSource(x.Source, x.LessonCount)).ToList();
    }

    public async Task<SourceDto> GetSourceAsync(int userId, int id, CancellationToken ct = default)
    {
        var source = await _db.Sources
            .AsNoTracking()
            .Include(s => s.GeneratedLessons)
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId, ct)
            ?? throw new NotFoundException("Không tìm thấy nguồn tài liệu.");

        return MapSource(source, source.GeneratedLessons.Count);
    }

    public async Task<SourceDto> CreateSourceAsync(
        int userId, CreateSourceRequest request, CancellationToken ct = default)
    {
        var type = request.SourceType.Trim().ToLowerInvariant();
        if (type is not ("web" or "text" or "video" or "document"))
        {
            throw new BadRequestException("Loại nguồn không hợp lệ.");
        }

        var content = request.Content?.Trim();
        if (string.IsNullOrWhiteSpace(content) &&
            request.FetchContentFromUrl &&
            type == "web" &&
            !string.IsNullOrWhiteSpace(request.Url))
        {
            content = await FetchWebContentAsync(request.Url, ct);
        }

        if (type is "text" or "document" && string.IsNullOrWhiteSpace(content))
        {
            throw new BadRequestException("Vui lòng dán nội dung cho nguồn dạng văn bản/tài liệu.");
        }

        var source = new Source
        {
            UserId = userId,
            SourceType = type,
            Title = TextUtil.Truncate(request.Title.Trim(), 300),
            Url = string.IsNullOrWhiteSpace(request.Url) ? null : TextUtil.Truncate(request.Url.Trim(), 1000),
            Content = string.IsNullOrWhiteSpace(content) ? null : TextUtil.Truncate(content, 200_000),
            CreatedAt = DateTime.UtcNow
        };

        _db.Sources.Add(source);
        await _db.SaveChangesAsync(ct);

        return MapSource(source, 0);
    }

    public async Task<SourceDto> UpdateSourceAsync(
        int userId, int id, UpdateSourceRequest request, CancellationToken ct = default)
    {
        var source = await _db.Sources
            .Include(s => s.GeneratedLessons)
            .FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId, ct)
            ?? throw new NotFoundException("Không tìm thấy nguồn tài liệu.");

        source.Title = TextUtil.Truncate(request.Title.Trim(), 300);
        source.Url = string.IsNullOrWhiteSpace(request.Url) ? null : TextUtil.Truncate(request.Url.Trim(), 1000);
        source.Content = string.IsNullOrWhiteSpace(request.Content)
            ? source.Content
            : TextUtil.Truncate(request.Content.Trim(), 200_000);

        await _db.SaveChangesAsync(ct);
        return MapSource(source, source.GeneratedLessons.Count);
    }

    public async Task DeleteSourceAsync(int userId, int id, CancellationToken ct = default)
    {
        var source = await _db.Sources.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId, ct)
                     ?? throw new NotFoundException("Không tìm thấy nguồn tài liệu.");

        var lessons = await _db.GeneratedLessons.Where(l => l.SourceId == id).ToListAsync(ct);
        foreach (var lesson in lessons) lesson.SourceId = null;

        var readings = await _db.ReadingPassages.Where(p => p.SourceId == id).ToListAsync(ct);
        foreach (var passage in readings) passage.SourceId = null;

        var words = await _db.UserWords.Where(uw => uw.SourceId == id).ToListAsync(ct);
        foreach (var word in words) word.SourceId = null;

        _db.Sources.Remove(source);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<LessonDetailDto> GenerateLessonAsync(
        int userId, int sourceId, GenerateLessonRequest request, CancellationToken ct = default)
    {
        var source = await _db.Sources
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == sourceId && s.UserId == userId, ct)
            ?? throw new NotFoundException("Không tìm thấy nguồn tài liệu.");

        if (string.IsNullOrWhiteSpace(source.Content))
        {
            throw new BadRequestException("Nguồn này chưa có nội dung. Hãy bổ sung nội dung trước khi sinh bài.");
        }

        if (request.LevelId is not null &&
            !await _db.Levels.AnyAsync(l => l.Id == request.LevelId, ct))
        {
            throw new BadRequestException("Trình độ không hợp lệ.");
        }

        var tokens = TextUtil.Tokenize(source.Content);
        var frequencies = tokens
            .Where(t => t.Length >= 3 && !TextUtil.IsStopWord(t) && t.All(char.IsLetter))
            .GroupBy(t => t)
            .Select(g => new { Word = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .ThenBy(x => x.Word)
            .Take(Math.Clamp(request.TargetWords, 3, 50) * 5)
            .ToList();

        var candidateLemmas = frequencies.Select(f => f.Word).ToList();
        var localWords = await _db.Words
            .AsNoTracking()
            .Include(w => w.WordSenses).ThenInclude(s => s.PartOfSpeech)
            .Include(w => w.WordSenses).ThenInclude(s => s.Level)
            .Include(w => w.WordSenses).ThenInclude(s => s.SenseTranslations)
            .Include(w => w.WordSenses).ThenInclude(s => s.Examples)
            .Where(w => candidateLemmas.Contains(w.Lemma))
            .ToDictionaryAsync(w => w.Lemma, ct);

        var picked = new List<PickedItem>();
        var seenSenses = new HashSet<int>();
        var enrichUsed = 0;

        foreach (var candidate in frequencies)
        {
            if (picked.Count >= Math.Clamp(request.TargetWords, 3, 50)) break;

            var context = TextUtil.SentenceAround(source.Content, candidate.Word);
            PickedItem? item = null;

            if (localWords.TryGetValue(candidate.Word, out var local))
            {
                var choices = local.WordSenses.Where(s => s.SenseTranslations.Any()).ToList();
                if (choices.Count > 0)
                {
                    var matcherInput = choices.Select(s => new SenseCandidate(
                        s.Id, s.DefinitionEn, s.Examples.Select(e => e.SentenceEn).ToList(),
                        s.PartOfSpeech.Code)).ToList();
                    var choice = SenseMatcher.Choose(context, matcherInput, local.Lemma);
                    var sense = choices[Math.Max(0, choice.Index)];

                    item = new PickedItem(
                        sense.Id,
                        local.Lemma,
                        local.WordPronunciations.FirstOrDefault(p => p.Accent == "US")?.Ipa,
                        BestMeaning(sense),
                        sense.DefinitionEn,
                        sense.PartOfSpeech.Code,
                        sense.Level?.Code,
                        context);
                }
            }
            else if (request.EnrichUnknown && enrichUsed < MaxUnknownEnrich)
            {
                enrichUsed++;
                try
                {
                    var word = await _dictionary.GetWordAsync(userId, candidate.Word, ct);
                    if (word.Senses.Count > 0)
                    {
                        var matcherInput = word.Senses.Select(s => new SenseCandidate(
                            s.Id, s.DefinitionEn, s.Examples.Select(e => e.SentenceEn).ToList(),
                            s.PartOfSpeech)).ToList();
                        var choice = SenseMatcher.Choose(context, matcherInput, word.Lemma);
                        var sense = word.Senses[Math.Max(0, choice.Index)];

                        item = new PickedItem(
                            sense.Id,
                            word.Lemma,
                            word.PhoneticUs,
                            sense.MeaningVi,
                            sense.DefinitionEn,
                            sense.PartOfSpeech,
                            sense.LevelCode,
                            context);
                    }
                }
                catch (AppException ex)
                {
                    _logger.LogDebug(ex, "Skip word {Word} while generating lesson", candidate.Word);
                }
            }

            if (item is null || !seenSenses.Add(item.SenseId)) continue;
            picked.Add(item);
        }

        if (picked.Count == 0)
        {
            throw new BadRequestException(
                "Không trích được từ vựng phù hợp. Hãy thêm nội dung dài hơn hoặc bật bổ sung từ mới.");
        }

        var lesson = new GeneratedLesson
        {
            UserId = userId,
            SourceId = source.Id,
            LevelId = request.LevelId,
            Title = TextUtil.Truncate($"Từ vựng từ: {source.Title}", 300),
            CreatedAt = DateTime.UtcNow
        };

        var order = 1;
        foreach (var item in picked)
        {
            lesson.LessonItems.Add(new LessonItem
            {
                SenseId = item.SenseId,
                ItemOrder = (short)order++,
                ContextSentence = TextUtil.Truncate(item.Context, 1000)
            });
        }

        _db.GeneratedLessons.Add(lesson);
        await _db.SaveChangesAsync(ct);

        if (request.SaveToNotebook)
        {
            var existingSenseIds = await _db.UserWords
                .Where(uw => uw.UserId == userId && picked.Select(p => p.SenseId).Contains(uw.SenseId))
                .Select(uw => uw.SenseId)
                .ToListAsync(ct);

            var existing = existingSenseIds.ToHashSet();
            foreach (var item in picked.Where(p => !existing.Contains(p.SenseId)))
            {
                _db.UserWords.Add(new UserWord
                {
                    UserId = userId,
                    SenseId = item.SenseId,
                    SourceId = source.Id,
                    ContextSentence = TextUtil.Truncate(item.Context, 1000),
                    Status = "new",
                    AddedAt = DateTime.UtcNow,
                    SrsState = new SrsState
                    {
                        DueAt = DateTime.UtcNow,
                        IntervalDays = 0,
                        Repetitions = 0,
                        EaseFactor = 2.5m
                    }
                });
            }

            await _db.SaveChangesAsync(ct);
        }

        return await GetLessonAsync(userId, lesson.Id, ct);
    }

    public async Task<IReadOnlyList<LessonSummaryDto>> ListLessonsAsync(
        int userId, CancellationToken ct = default)
    {
        var lessons = await _db.GeneratedLessons
            .AsNoTracking()
            .Include(l => l.Source)
            .Include(l => l.Level)
            .Where(l => l.UserId == userId)
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new LessonSummaryDto(
                l.Id,
                l.Title,
                l.SourceId,
                l.Source != null ? l.Source.Title : null,
                l.LevelId,
                l.Level != null ? l.Level.Code : null,
                l.LessonItems.Count,
                l.CreatedAt))
            .ToListAsync(ct);

        return lessons;
    }

    public async Task<LessonDetailDto> GetLessonAsync(int userId, int id, CancellationToken ct = default)
    {
        var lesson = await _db.GeneratedLessons
            .AsNoTracking()
            .Include(l => l.Source)
            .Include(l => l.Level)
            .Include(l => l.LessonItems).ThenInclude(i => i.Sense).ThenInclude(s => s.Word)
            .ThenInclude(w => w.WordPronunciations)
            .Include(l => l.LessonItems).ThenInclude(i => i.Sense).ThenInclude(s => s.PartOfSpeech)
            .Include(l => l.LessonItems).ThenInclude(i => i.Sense).ThenInclude(s => s.Level)
            .Include(l => l.LessonItems).ThenInclude(i => i.Sense).ThenInclude(s => s.SenseTranslations)
            .Include(l => l.LessonItems).ThenInclude(i => i.Sense).ThenInclude(s => s.Examples)
            .FirstOrDefaultAsync(l => l.Id == id && l.UserId == userId, ct)
            ?? throw new NotFoundException("Không tìm thấy bài học.");

        var senseIds = lesson.LessonItems.Select(i => i.SenseId).ToList();
        var saved = await _db.UserWords
            .AsNoTracking()
            .Where(uw => uw.UserId == userId && senseIds.Contains(uw.SenseId))
            .ToDictionaryAsync(uw => uw.SenseId, uw => uw.Id, ct);

        var items = lesson.LessonItems
            .OrderBy(i => i.ItemOrder)
            .Select(i =>
            {
                var sense = i.Sense;
                var us = sense.Word.WordPronunciations.FirstOrDefault(p => p.Accent == "US");
                return new LessonItemDto(
                    sense.Id,
                    sense.Word.Lemma,
                    us?.Ipa,
                    BestMeaning(sense),
                    sense.DefinitionEn,
                    sense.PartOfSpeech?.Code ?? "phrase",
                    i.ContextSentence,
                    i.ItemOrder,
                    saved.ContainsKey(sense.Id),
                    saved.GetValueOrDefault(sense.Id) == 0 ? null : saved.GetValueOrDefault(sense.Id));
            })
            .ToList();

        return new LessonDetailDto(
            lesson.Id,
            lesson.Title,
            lesson.SourceId,
            lesson.Source?.Title,
            lesson.LevelId,
            lesson.Level?.Code,
            lesson.CreatedAt,
            items);
    }

    public async Task DeleteLessonAsync(int userId, int id, CancellationToken ct = default)
    {
        var lesson = await _db.GeneratedLessons
            .FirstOrDefaultAsync(l => l.Id == id && l.UserId == userId, ct)
            ?? throw new NotFoundException("Không tìm thấy bài học.");

        var tasks = await _db.PlanTasks.Where(t => t.LessonId == id).ToListAsync(ct);
        foreach (var task in tasks) task.LessonId = null;

        _db.GeneratedLessons.Remove(lesson);
        await _db.SaveChangesAsync(ct);
    }

    private async Task<string?> FetchWebContentAsync(string url, CancellationToken ct)
    {
        if (!Uri.TryCreate(url, UriKind.Absolute, out var uri) ||
            (uri.Scheme != Uri.UriSchemeHttp && uri.Scheme != Uri.UriSchemeHttps))
        {
            throw new BadRequestException("URL phải bắt đầu bằng http hoặc https.");
        }

        if (IsPrivateHost(uri.Host))
        {
            throw new BadRequestException("Không hỗ trợ địa chỉ nội bộ/localhost.");
        }

        try
        {
            var client = _httpClientFactory.CreateClient("web");
            using var response = await client.GetAsync(uri, ct);
            if (!response.IsSuccessStatusCode)
            {
                throw new BadRequestException($"Không tải được trang (HTTP {(int)response.StatusCode}).");
            }

            var html = await response.Content.ReadAsStringAsync(ct);
            if (html.Length > 500_000) html = html[..500_000];
            var text = TextUtil.StripHtml(html);

            if (string.IsNullOrWhiteSpace(text))
            {
                throw new BadRequestException("Trang không có nội dung văn bản để học.");
            }

            return TextUtil.Truncate(text, 200_000);
        }
        catch (BadRequestException)
        {
            throw;
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            _logger.LogWarning(ex, "Fetch web source failed: {Url}", url);
            throw new BadRequestException("Không tải được nội dung từ URL. Hãy dán nội dung thủ công.");
        }
    }

    private static bool IsPrivateHost(string host) =>
        host.Equals("localhost", StringComparison.OrdinalIgnoreCase) ||
        host.StartsWith("127.", StringComparison.Ordinal) ||
        host.StartsWith("10.", StringComparison.Ordinal) ||
        host.StartsWith("192.168.", StringComparison.Ordinal) ||
        host.StartsWith("169.254.", StringComparison.Ordinal) ||
        host == "::1";

    private static SourceDto MapSource(Source source, int lessonCount) => new(
        source.Id,
        source.SourceType,
        source.Title,
        source.Url,
        source.Content?.Length ?? 0,
        source.CreatedAt,
        lessonCount);

    private static string BestMeaning(WordSense sense) =>
        sense.SenseTranslations
            .OrderByDescending(t => t.IsVerified)
            .Select(t => t.MeaningVi)
            .FirstOrDefault() ?? TextUtil.SimplifyMeaning(sense.DefinitionEn);

    private sealed record PickedItem(
        int SenseId,
        string Lemma,
        string? Phonetic,
        string Meaning,
        string Definition,
        string PartOfSpeech,
        string? LevelCode,
        string Context);
}
