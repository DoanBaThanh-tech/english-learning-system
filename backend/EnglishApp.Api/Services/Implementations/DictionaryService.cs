using EnglishApp.Api.Common.Exceptions;
using EnglishApp.Api.Common.Utilities;
using EnglishApp.Api.Data;
using EnglishApp.Api.DTOs.Dictionary;
using EnglishApp.Api.Models;
using EnglishApp.Api.Repositories.Specific;
using EnglishApp.Api.Services.External;
using EnglishApp.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishApp.Api.Services.Implementations;

/// <summary>
/// Tra từ theo mô hình 3 lớp cache:
/// 1) DB curated (nghĩa đã kiểm duyệt) -> 2) Free Dictionary API + dịch định nghĩa -> 3) dịch máy toàn câu.
/// Chọn nghĩa theo ngữ cảnh bằng AI (nếu cấu hình) hoặc SenseMatcher offline.
/// </summary>
public sealed class DictionaryService : IDictionaryService
{
    private readonly AppDbContext _db;
    private readonly IWordRepository _words;
    private readonly IDictionaryApiClient _dictionaryApi;
    private readonly ITranslationService _translation;
    private readonly IAiService _ai;
    private readonly ILogger<DictionaryService> _logger;

    public DictionaryService(
        AppDbContext db,
        IWordRepository words,
        IDictionaryApiClient dictionaryApi,
        ITranslationService translation,
        IAiService ai,
        ILogger<DictionaryService> logger)
    {
        _db = db;
        _words = words;
        _dictionaryApi = dictionaryApi;
        _translation = translation;
        _ai = ai;
        _logger = logger;
    }

    public async Task<IReadOnlyList<WordSearchItemDto>> SearchAsync(
        int userId, string query, int limit, CancellationToken ct = default)
    {
        limit = Math.Clamp(limit, 1, 30);
        var term = TextUtil.Normalize(query);
        if (term.Length == 0) return Array.Empty<WordSearchItemDto>();

        var words = await _words.SearchAsync(term, limit, ct);

        if (words.Count == 0)
        {
            foreach (var candidate in TextUtil.LemmaCandidates(term).Take(3))
            {
                var enriched = await TryEnrichAsync(candidate, ct);
                if (enriched is not null)
                {
                    words = await _words.SearchAsync(enriched.Lemma, limit, ct);
                    break;
                }
            }
        }

        return words.Select(MapSearchItem).ToList();
    }

    public async Task<WordDto> GetWordAsync(int userId, string lemma, CancellationToken ct = default)
    {
        var word = await FindLocalAsync(lemma, ct);

        if (word is null)
        {
            word = await TryEnrichAsync(lemma, ct);
        }

        if (word is null)
        {
            throw new NotFoundException($"Chưa tìm thấy từ '{lemma}'. Hãy kiểm tra chính tả hoặc thử tra ngữ cảnh.");
        }

        return await MapWordAsync(userId, word, ct);
    }

    public async Task<WordDto> EnrichAsync(string lemma, CancellationToken ct = default)
    {
        var word = await TryEnrichAsync(lemma, ct);
        if (word is null)
        {
            throw new NotFoundException($"Không thể bổ sung dữ liệu cho từ '{lemma}'.");
        }

        return await MapWordAsync(0, word, ct);
    }

    public async Task<ContextLookupResult> ContextLookupAsync(
        int userId, ContextLookupRequest request, CancellationToken ct = default)
    {
        var sentence = request.Sentence.Trim();
        var rawWord = TextUtil.Normalize(request.Word);
        if (rawWord.Length == 0 || sentence.Length == 0)
        {
            throw new BadRequestException("Cần nhập từ và câu ngữ cảnh.");
        }

        var word = await ResolveContextWordAsync(rawWord, ct);
        var sentenceTranslation = request.TranslateSentence
            ? (await _translation.TranslateAsync(sentence, "en", "vi", ct))?.Text
            : null;

        if (word is null || word.WordSenses.Count == 0)
        {
            var fallbackWordTranslation = await _translation.TranslateAsync(rawWord, "en", "vi", ct);
            return new ContextLookupResult(
                rawWord,
                rawWord,
                null,
                null,
                fallbackWordTranslation?.Text ?? rawWord,
                string.Empty,
                string.Empty,
                null,
                45,
                "machine-translation",
                false,
                sentenceTranslation,
                Array.Empty<SenseAlternativeDto>());
        }

        var senses = word.WordSenses
            .OrderBy(s => s.SenseOrder)
            .Select(s => new
            {
                Sense = s,
                Meaning = BestMeaning(s),
                Definitions = s.DefinitionEn
            })
            .Where(x => !string.IsNullOrWhiteSpace(x.Meaning))
            .ToList();

        if (senses.Count == 0)
        {
            throw new NotFoundException("Từ này chưa có nghĩa tiếng Việt.");
        }

        var cacheHash = TextUtil.HashSentence(sentence);
        var cached = await _db.TranslationCaches
            .AsNoTracking()
            .Include(c => c.ChosenSense)
            .FirstOrDefaultAsync(c => c.WordId == word.Id && c.SentenceHash == cacheHash, ct);

        if (cached is not null)
        {
            var chosen = senses.FirstOrDefault(s => s.Sense.Id == cached.ChosenSenseId) ?? senses[0];
            return new ContextLookupResult(
                rawWord,
                word.Lemma,
                word.Id,
                cached.ChosenSenseId,
                cached.MeaningVi,
                chosen.Sense.DefinitionEn,
                chosen.Sense.PartOfSpeech?.Code ?? string.Empty,
                GetIpa(word, "US"),
                cached.ConfidencePct ?? 70,
                cached.Model ?? "cache",
                true,
                sentenceTranslation,
                BuildAlternatives(senses.Select(s => new SenseAltData(s.Sense.Id, s.Sense.PartOfSpeech?.Code ?? string.Empty, s.Sense.DefinitionEn, s.Meaning)).ToList(), cached.ChosenSenseId, cached.ConfidencePct ?? 70));
        }

        var chosenSense = senses[0].Sense;
        var chosenMeaning = senses[0].Meaning;
        var confidence = 60d;
        var source = "heuristic";
        var alternativesInput = senses
            .Select(s => new SenseAltData(s.Sense.Id, s.Sense.PartOfSpeech?.Code ?? string.Empty, s.Sense.DefinitionEn, s.Meaning))
            .ToList();

        var aiResult = await _ai.TranslateInContextAsync(
            rawWord, sentence, senses.Select(s => s.Definitions).ToList(), ct);

        if (aiResult is not null && aiResult.ChosenSenseIndex >= 0 && aiResult.ChosenSenseIndex < senses.Count)
        {
            chosenSense = senses[aiResult.ChosenSenseIndex].Sense;
            chosenMeaning = aiResult.MeaningVi;
            confidence = aiResult.Confidence;
            source = "ai";
        }
        else
        {
            var candidateList = senses
                .Select(s => new SenseCandidate(
                    s.Sense.Id,
                    s.Sense.DefinitionEn,
                    s.Sense.Examples.Select(e => e.SentenceEn).ToList(),
                    s.Sense.PartOfSpeech?.Code ?? "phrase"))
                .ToList();

            var choice = SenseMatcher.Choose(sentence, candidateList, rawWord);
            if (choice.Index >= 0)
            {
                chosenSense = senses[choice.Index].Sense;
                chosenMeaning = senses[choice.Index].Meaning;
                confidence = choice.Confidence;
            }
        }

        chosenMeaning = TextUtil.Truncate(chosenMeaning, 500);
        var result = new ContextLookupResult(
            rawWord,
            word.Lemma,
            word.Id,
            chosenSense.Id,
            chosenMeaning,
            chosenSense.DefinitionEn,
            chosenSense.PartOfSpeech?.Code ?? string.Empty,
            GetIpa(word, "US"),
            Math.Round(confidence, 1),
            source,
            false,
            sentenceTranslation,
            BuildAlternatives(alternativesInput, chosenSense.Id, confidence));

        await SaveCacheAsync(word.Id, cacheHash, sentence, chosenSense.Id, chosenMeaning, confidence, source, ct);
        return result;
    }

    public async Task<TranslateResponse> TranslateAsync(
        string text, string? from, string? to, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            throw new BadRequestException("Cần nhập nội dung cần dịch.");
        }

        var result = await _translation.TranslateAsync(
            text, string.IsNullOrWhiteSpace(from) ? "en" : from, string.IsNullOrWhiteSpace(to) ? "vi" : to, ct);

        if (result is null)
        {
            throw new AppException(StatusCodes.Status422UnprocessableEntity,
                "Dịch vụ dịch miễn phí đang tạm thời không phản hồi. Vui lòng thử lại sau ít phút.");
        }

        return new TranslateResponse(text, result.Text, result.Provider, result.FromCache);
    }

    public async Task<WordOfTheDayDto> GetWordOfTheDayAsync(int userId, CancellationToken ct = default)
    {
        var words = await _words.ListWithSensesAsync(500, ct);
        if (words.Count == 0)
        {
            throw new NotFoundException("Từ điển chưa có dữ liệu.");
        }

        var seed = DateTime.UtcNow.Year * 1000 + DateTime.UtcNow.DayOfYear;
        var index = seed % words.Count;
        var word = words[index];
        var sense = word.WordSenses.OrderBy(s => s.SenseOrder)
            .FirstOrDefault(s => s.Examples.Count > 0) ?? word.WordSenses.OrderBy(s => s.SenseOrder).First();

        var context = sense.Examples.FirstOrDefault()?.SentenceEn ?? sense.DefinitionEn;
        var meaning = BestMeaning(sense);

        return new WordOfTheDayDto(
            DateTime.UtcNow.Date,
            await MapWordAsync(userId, word, ct),
            context,
            meaning);
    }

    /// <summary>
    /// Tra theo ngữ cảnh ưu tiên dạng gốc của từ (booked -> book, manages -> manage)
    /// để lemma sạch hơn và có đủ nghĩa động từ/danh từ. Từ gốc chỉ được ưu tiên
    /// khi đã có trong DB hoặc bổ sung được; nếu không sẽ quay lại dạng gốc ban đầu.
    /// </summary>
    private async Task<Word?> ResolveContextWordAsync(string raw, CancellationToken ct)
    {
        var candidates = TextUtil.LemmaCandidates(raw).Distinct().ToList();
        var ordered = candidates
            .Where(c => !string.Equals(c, raw, StringComparison.OrdinalIgnoreCase))
            .Concat(candidates.Where(c => string.Equals(c, raw, StringComparison.OrdinalIgnoreCase)))
            .ToList();

        foreach (var candidate in ordered)
        {
            var local = await _words.GetByLemmaAsync(candidate, ct);
            if (local is not null)
            {
                return local;
            }

            var enriched = await TryEnrichAsync(candidate, ct);
            if (enriched is not null)
            {
                return enriched;
            }
        }

        return null;
    }

    private async Task<Word?> FindLocalAsync(string raw, CancellationToken ct)
    {
        foreach (var candidate in TextUtil.LemmaCandidates(raw).Distinct())
        {
            var word = await _words.GetByLemmaAsync(candidate, ct);
            if (word is not null)
            {
                return word;
            }
        }

        return null;
    }

    private async Task<Word?> TryEnrichAsync(string raw, CancellationToken ct)
    {
        var lemma = TextUtil.Normalize(TextUtil.LemmaCandidates(raw).First());
        var existing = await _words.GetByLemmaAsync(lemma, ct);
        if (existing is not null) return existing;

        var external = await _dictionaryApi.FetchAsync(lemma, ct);
        if (external is null || external.Meanings.Count == 0)
        {
            return null;
        }

        var levels = await _db.Levels.AsNoTracking().ToDictionaryAsync(l => l.Code, l => l.Id, ct);
        var partsOfSpeech = await _db.PartsOfSpeeches.AsNoTracking().ToDictionaryAsync(p => p.Code, p => p.Id, ct);

        var phonetics = external.Phonetics;
        var us = phonetics.FirstOrDefault(p => p.Audio?.Contains("-us", StringComparison.OrdinalIgnoreCase) == true)
                 ?? phonetics.FirstOrDefault(p => !string.IsNullOrWhiteSpace(p.Audio));
        var uk = phonetics.FirstOrDefault(p => p.Audio is not null &&
                                               (p.Audio.Contains("-uk", StringComparison.OrdinalIgnoreCase) ||
                                                p.Audio.Contains("-gb", StringComparison.OrdinalIgnoreCase)));
        var anyText = phonetics.FirstOrDefault(p => !string.IsNullOrWhiteSpace(p.Text))?.Text ?? string.Empty;

        var word = new Word
        {
            Lemma = TextUtil.Truncate(lemma, 100),
            CreatedAt = DateTime.UtcNow
        };

        word.WordPronunciations.Add(new WordPronunciation
        {
            Accent = "US",
            Ipa = us?.Text ?? anyText,
            AudioUrl = us?.Audio
        });
        word.WordPronunciations.Add(new WordPronunciation
        {
            Accent = "UK",
            Ipa = uk?.Text ?? anyText,
            AudioUrl = uk?.Audio
        });

        var definitions = SelectDefinitions(external.Meanings, 8);

        var order = 1;
        foreach (var item in definitions)
        {
            var posCode = MapPartOfSpeech(item.Meaning.PartOfSpeech);
            var partOfSpeechId = partsOfSpeech.GetValueOrDefault(posCode, partsOfSpeech["phrase"]);

            var sense = new WordSense
            {
                PartOfSpeechId = partOfSpeechId,
                LevelId = levels.GetValueOrDefault("B1"),
                DefinitionEn = TextUtil.Truncate(item.Definition.Definition, 1000),
                SenseOrder = (short)order++,
                Source = "dictionaryapi"
            };

            if (!string.IsNullOrWhiteSpace(item.Definition.Example))
            {
                sense.Examples.Add(new Example
                {
                    SentenceEn = TextUtil.Truncate(item.Definition.Example, 1000),
                    Source = "dictionaryapi"
                });
            }

            word.WordSenses.Add(sense);
        }

        if (word.WordSenses.Count == 0)
        {
            return null;
        }

        // Dịch định nghĩa song song có giới hạn để không vượt hạn mức dịch miễn phí.
        using var semaphore = new SemaphoreSlim(2);
        var translationTasks = word.WordSenses.Select(async sense =>
        {
            await semaphore.WaitAsync(ct);
            try
            {
                var translated = await _translation.TranslateAsync(sense.DefinitionEn, "en", "vi", ct);
                var meaning = TextUtil.SimplifyMeaning(translated?.Text ?? sense.DefinitionEn);
                sense.SenseTranslations.Add(new SenseTranslation
                {
                    MeaningVi = TextUtil.Truncate(meaning, 500),
                    Source = translated?.Provider ?? "dictionaryapi",
                    IsVerified = false
                });
            }
            finally
            {
                semaphore.Release();
            }
        });

        await Task.WhenAll(translationTasks);

        try
        {
            _db.Words.Add(word);
            await _db.SaveChangesAsync(ct);
            _logger.LogInformation("Enriched word {Lemma} with {Senses} senses", word.Lemma, word.WordSenses.Count);
            // Nạp lại kèm PartOfSpeech/Level để response đầu tiên có đủ nhãn.
            return await _words.GetByLemmaAsync(lemma, ct) ?? word;
        }
        catch (DbUpdateException)
        {
            _db.Entry(word).State = EntityState.Detached;
            return await _words.GetByLemmaAsync(lemma, ct);
        }
    }

    /// <summary>
    /// Chọn nghĩa đa dạng theo từ loại thay vì lấy 6 định nghĩa đầu tiên.
    /// Từ điển mở thường xếp rất nhiều nghĩa danh từ trước, nên nếu lấy tuần tự
    /// một từ vừa là danh từ vừa là động từ sẽ mất hết nghĩa động từ —
    /// đúng loại nghĩa mà tra theo ngữ cảnh cần nhất.
    /// </summary>
    private static List<(ExternalMeaning Meaning, ExternalDefinition Definition)> SelectDefinitions(
        IReadOnlyList<ExternalMeaning> meanings, int limit)
    {
        var groups = meanings
            .Where(m => m.Definitions.Count > 0)
            .Select((m, order) => new
            {
                Meaning = m,
                Pos = MapPartOfSpeech(m.PartOfSpeech),
                Order = order
            })
            .OrderBy(g => PosPriority(g.Pos))
            .ThenBy(g => g.Order)
            .ToList();

        var cursors = new int[groups.Count];
        var taken = new int[groups.Count];
        var seen = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var result = new List<(ExternalMeaning, ExternalDefinition)>();

        bool TryTake(int groupIndex, int cap)
        {
            if (result.Count >= limit || groupIndex >= groups.Count) return false;

            var group = groups[groupIndex];
            if (taken[groupIndex] >= cap || cursors[groupIndex] >= group.Meaning.Definitions.Count)
            {
                return false;
            }

            var definition = group.Meaning.Definitions[cursors[groupIndex]++];
            taken[groupIndex]++;
            var key = TextUtil.Normalize(definition.Definition);
            if (key.Length == 0 || !seen.Add(key))
            {
                return false;
            }

            result.Add((group.Meaning, definition));
            return true;
        }

        // Vòng 1–3: mỗi từ loại lần lượt có 1, 2, 3 nghĩa để không bỏ sót
        // tính từ/trạng từ khi từ đó chủ yếu là danh từ hoặc động từ.
        for (var round = 1; round <= 3; round++)
        {
            for (var groupIndex = 0; groupIndex < groups.Count; groupIndex++)
            {
                TryTake(groupIndex, round);
                if (result.Count >= limit) return result;
            }
        }

        // Còn chỗ thì bổ sung thêm nghĩa cùng từ loại, ưu tiên động từ rồi danh từ.
        var changed = true;
        while (result.Count < limit && changed)
        {
            changed = false;
            for (var groupIndex = 0; groupIndex < groups.Count; groupIndex++)
            {
                if (TryTake(groupIndex, 6)) changed = true;
                if (result.Count >= limit) break;
            }
        }

        return result;
    }

    private static int PosPriority(string pos) => pos switch
    {
        "verb" => 0,
        "noun" => 1,
        "adjective" => 2,
        "adverb" => 3,
        "phrase" => 4,
        _ => 5
    };

    private async Task<WordDto> MapWordAsync(int userId, Word word, CancellationToken ct)
    {
        var saved = new Dictionary<int, int>();
        if (userId > 0)
        {
            saved = await _db.UserWords
                .AsNoTracking()
                .Where(uw => uw.UserId == userId && uw.Sense.WordId == word.Id)
                .Select(uw => new { uw.SenseId, uw.Id })
                .ToDictionaryAsync(x => x.SenseId, x => x.Id, ct);
        }

        return new WordDto(
            word.Id,
            word.Lemma,
            GetIpa(word, "US"),
            GetIpa(word, "UK"),
            GetAudio(word, "US"),
            GetAudio(word, "UK"),
            word.WordSenses.OrderBy(s => s.SenseOrder).Select(s => MapSense(s, saved)).ToList(),
            saved.Count > 0,
            saved.Values.FirstOrDefault());
    }

    private static SenseDto MapSense(WordSense sense, IReadOnlyDictionary<int, int> saved) => new(
        sense.Id,
        sense.PartOfSpeech?.Code ?? "phrase",
        sense.PartOfSpeech?.NameVi ?? "Cụm từ",
        sense.Level?.Code,
        sense.DefinitionEn,
        BestMeaning(sense),
        sense.SenseTranslations.Any(t => t.IsVerified),
        sense.Examples.Select(e => new ExampleDto(e.SentenceEn, e.SentenceVi)).ToList());

    private static WordSearchItemDto MapSearchItem(Word word)
    {
        var sense = word.WordSenses.OrderBy(s => s.SenseOrder).FirstOrDefault();
        return new WordSearchItemDto(
            word.Id,
            word.Lemma,
            GetIpa(word, "US"),
            sense is null ? string.Empty : BestMeaning(sense),
            sense?.PartOfSpeech?.Code ?? "phrase",
            sense?.Level?.Code);
    }

    private static string BestMeaning(WordSense sense) =>
        sense.SenseTranslations?
            .OrderByDescending(t => t.IsVerified)
            .Select(t => t.MeaningVi)
            .FirstOrDefault()
        ?? TextUtil.SimplifyMeaning(sense.DefinitionEn);

    private static string? GetIpa(Word word, string accent) =>
        word.WordPronunciations.FirstOrDefault(p => p.Accent == accent)?.Ipa;

    private static string? GetAudio(Word word, string accent) =>
        word.WordPronunciations.FirstOrDefault(p => p.Accent == accent)?.AudioUrl;

    private static string MapPartOfSpeech(string external) => external.ToLowerInvariant() switch
    {
        "noun" => "noun",
        "verb" => "verb",
        "adjective" => "adjective",
        "adverb" => "adverb",
        "preposition" => "preposition",
        "conjunction" => "conjunction",
        "pronoun" => "pronoun",
        "determiner" => "pronoun",
        "interjection" => "interjection",
        "exclamation" => "interjection",
        _ => "phrase"
    };

    private static IReadOnlyList<SenseAlternativeDto> BuildAlternatives(
        IReadOnlyList<SenseAltData> senses, int? chosenId, double chosenConfidence)
    {
        return senses.Select((s, index) =>
        {
            var confidence = s.Id == chosenId
                ? chosenConfidence
                : Math.Max(30, chosenConfidence - 12 - index * 5);
            return new SenseAlternativeDto(s.Id, s.Pos, s.Definition, s.Meaning, Math.Round(confidence, 1));
        }).Take(6).ToList();
    }

    private async Task SaveCacheAsync(
        int wordId, byte[] hash, string sentence, int? senseId, string meaning,
        double confidence, string source, CancellationToken ct)
    {
        var cacheEntity = new TranslationCache
        {
            WordId = wordId,
            SentenceHash = hash,
            SentenceText = TextUtil.Truncate(sentence, 1000),
            ChosenSenseId = senseId,
            MeaningVi = TextUtil.Truncate(meaning, 500),
            ConfidencePct = (byte)Math.Clamp(Math.Round(confidence), 0, 100),
            Model = TextUtil.Truncate(source, 50),
            CreatedAt = DateTime.UtcNow
        };

        try
        {
            _db.TranslationCaches.Add(cacheEntity);
            await _db.SaveChangesAsync(ct);
        }
        catch (DbUpdateException)
        {
            // Hai request đồng thời có thể cùng ghi cache; bỏ qua bản ghi trùng.
            _db.Entry(cacheEntity).State = EntityState.Detached;
        }
    }

    private sealed record SenseAltData(int Id, string Pos, string Definition, string Meaning);
}
