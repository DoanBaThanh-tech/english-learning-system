using System.Text.RegularExpressions;
using EnglishApp.Api.Common.Exceptions;
using EnglishApp.Api.Common.Utilities;
using EnglishApp.Api.Data;
using EnglishApp.Api.DTOs.Pronunciation;
using EnglishApp.Api.Models;
using EnglishApp.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishApp.Api.Services.Implementations;

/// <summary>
/// Chấm phát âm từ transcript (Web Speech API hoặc ASR khác) bằng căn chỉnh từ,
/// sinh gợi ý theo lỗi người Việt và lưu lịch sử. Có thể thay bằng Azure Speech
/// sau này chỉ cần thêm một implementation mới của IPronunciationService.
/// </summary>
public sealed class PronunciationService : IPronunciationService
{
    private static readonly (string Pattern, string Tip)[] PhonemeTips =
    {
        ("th", "Bật hơi đầu lưỡi cho /θ/ (think, three), tránh đọc thành /t/."),
        ("sh", "Tròn môi, đẩy hơi cho /ʃ/ (she, ship)."),
        ("ch", "Bật hơi cho /tʃ/ (check, chair)."),
        ("r", "Uốn lưỡi nhẹ cho /r/, không đọc thành /z/ hoặc /l/."),
        ("l", "Đặt đầu lưỡi sau răng trên cho /l/ (light, small)."),
        ("v", "Răng trên chạm môi dưới cho /v/, tránh đọc thành /w/."),
        ("ing", "Giữ âm mũi cuối /ŋ/ cho -ing."),
        ("ed", "Phân biệt đuôi -ed: /t/, /d/ hoặc /ɪd/ tùy từ gốc."),
        ("s", "Giữ âm cuối /s/ rõ ràng, tránh bỏ đuôi.")
    };

    private readonly AppDbContext _db;
    private readonly IFileStorageService _files;
    private readonly IStatsService _stats;

    public PronunciationService(AppDbContext db, IFileStorageService files, IStatsService stats)
    {
        _db = db;
        _files = files;
        _stats = stats;
    }

    public async Task<PronunciationAttemptDto> AnalyzeAsync(
        int userId, AnalyzePronunciationRequest request, CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(request.ReferenceText))
        {
            throw new BadRequestException("Cần nhập câu mẫu cần đọc.");
        }

        if (string.IsNullOrWhiteSpace(request.Transcript))
        {
            throw new BadRequestException(
                "Chưa có transcript giọng đọc. Hãy dùng micro của trình duyệt (Web Speech API) " +
                "hoặc gửi transcript đã nhận dạng để chấm điểm.");
        }

        if (request.WordId is not null)
        {
            var wordExists = await _db.Words.AnyAsync(w => w.Id == request.WordId, ct);
            if (!wordExists) throw new BadRequestException("Từ cần chấm không tồn tại.");
        }

        var comparison = SpeechComparer.Compare(request.ReferenceText, request.Transcript);
        var phonemes = BuildPhonemeScores(comparison);

        var attempt = new PronunciationAttempt
        {
            UserId = userId,
            WordId = request.WordId,
            ReferenceText = TextUtil.Truncate(request.ReferenceText, 500),
            AudioUrl = string.IsNullOrWhiteSpace(request.AudioUrl)
                ? null
                : TextUtil.Truncate(request.AudioUrl, 500),
            OverallScore = (byte)Math.Clamp(comparison.Score, 0, 100),
            CreatedAt = DateTime.UtcNow,
            PronunciationPhonemeScores = phonemes.Select(p => new PronunciationPhonemeScore
            {
                Phoneme = TextUtil.Truncate(p.Phoneme, 10),
                Score = p.Score,
                Feedback = TextUtil.Truncate(p.Feedback, 300)
            }).ToList()
        };

        _db.PronunciationAttempts.Add(attempt);
        await _db.SaveChangesAsync(ct);

        var speakingSkillId = await _db.Skills
            .Where(s => s.Code == "speaking")
            .Select(s => s.Id)
            .FirstAsync(ct);

        foreach (var mistake in comparison.Words.Where(w => !w.Correct).Take(3))
        {
            var detail = string.IsNullOrWhiteSpace(mistake.Spoken)
                ? $"Bỏ sót từ '{mistake.Word}' khi đọc."
                : $"Đọc '{mistake.Word}' thành '{mistake.Spoken}'.";

            var tip = PhonemeTips.FirstOrDefault(p =>
                Regex.IsMatch(mistake.Word, p.Pattern, RegexOptions.IgnoreCase)).Tip
                ?? "Đọc chậm và rõ từng âm tiết của từ này.";

            _db.LearnerErrors.Add(new LearnerError
            {
                UserId = userId,
                SkillId = speakingSkillId,
                PronunciationAttemptId = attempt.Id,
                Detail = TextUtil.Truncate(detail, 500),
                Correction = TextUtil.Truncate(tip, 500),
                IsResolved = false,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync(ct);
        await _stats.RecalculateSkillsAsync(userId, ct);

        var lemma = request.WordId is null
            ? null
            : await _db.Words.Where(w => w.Id == request.WordId).Select(w => w.Lemma).FirstOrDefaultAsync(ct);

        return Map(attempt, lemma, comparison.Words, comparison.Tips);
    }

    public async Task<PronunciationAttemptDto> AnalyzeAudioAsync(
        int userId, IFormFile? audio, int? wordId, string referenceText, string? transcript,
        CancellationToken ct = default)
    {
        string? audioUrl = null;
        if (audio is not null)
        {
            audioUrl = await _files.SaveAsync(audio, "uploads/pronunciation", ct);
        }

        return await AnalyzeAsync(userId, new AnalyzePronunciationRequest(
            wordId, referenceText, transcript ?? string.Empty, audioUrl), ct);
    }

    public async Task<IReadOnlyList<PronunciationAttemptDto>> ListAsync(
        int userId, int limit, CancellationToken ct = default)
    {
        var attempts = await _db.PronunciationAttempts
            .AsNoTracking()
            .Include(a => a.Word)
            .Include(a => a.PronunciationPhonemeScores)
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.CreatedAt)
            .Take(Math.Clamp(limit, 1, 50))
            .ToListAsync(ct);

        return attempts
            .Select(a => Map(a, a.Word?.Lemma, Array.Empty<SpeechWordResult>(),
                a.PronunciationPhonemeScores
                    .Where(p => !string.IsNullOrWhiteSpace(p.Feedback))
                    .Select(p => p.Feedback!)
                    .Distinct()
                    .Take(4)
                    .ToList()))
            .ToList();
    }

    public async Task<PronunciationAttemptDto> GetAsync(
        int userId, long id, CancellationToken ct = default)
    {
        var attempt = await _db.PronunciationAttempts
            .AsNoTracking()
            .Include(a => a.Word)
            .Include(a => a.PronunciationPhonemeScores)
            .FirstOrDefaultAsync(a => a.Id == id && a.UserId == userId, ct)
            ?? throw new NotFoundException("Không tìm thấy lần luyện phát âm.");

        return Map(attempt, attempt.Word?.Lemma, Array.Empty<SpeechWordResult>(),
            attempt.PronunciationPhonemeScores
                .Where(p => !string.IsNullOrWhiteSpace(p.Feedback))
                .Select(p => p.Feedback!)
                .Distinct()
                .Take(4)
                .ToList());
    }

    public async Task<PronunciationSummaryDto> SummaryAsync(int userId, CancellationToken ct = default)
    {
        var attempts = await _db.PronunciationAttempts
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .ToListAsync(ct);

        if (attempts.Count == 0)
        {
            return new PronunciationSummaryDto(0, 0, 0, null, Array.Empty<string>());
        }

        var feedback = await _db.PronunciationPhonemeScores
            .AsNoTracking()
            .Where(p => p.Attempt.UserId == userId && p.Feedback != null)
            .OrderBy(p => p.Score)
            .Select(p => p.Feedback!)
            .Distinct()
            .Take(5)
            .ToListAsync(ct);

        return new PronunciationSummaryDto(
            attempts.Count,
            Math.Round(attempts.Average(a => a.OverallScore), 1),
            attempts.Max(a => a.OverallScore),
            attempts.Max(a => a.CreatedAt),
            feedback);
    }

    private static List<(string Phoneme, byte Score, string Feedback)> BuildPhonemeScores(
        SpeechComparison comparison)
    {
        var result = new List<(string Phoneme, byte Score, string Feedback)>();

        foreach (var word in comparison.Words.Where(w => !w.Correct).Take(5))
        {
            var matches = PhonemeTips
                .Where(p => Regex.IsMatch(word.Word, p.Pattern, RegexOptions.IgnoreCase))
                .Take(2)
                .ToList();

            if (matches.Count == 0)
            {
                result.Add((
                    TextUtil.Truncate(word.Word, 10),
                    (byte)Math.Clamp(comparison.Score - 20, 25, 80),
                    "Đọc rõ từng âm tiết và giữ âm cuối của từ này."));
                continue;
            }

            foreach (var match in matches)
            {
                result.Add((
                    match.Pattern,
                    (byte)Math.Clamp(comparison.Score - 18, 25, 80),
                    match.Tip));
            }
        }

        if (result.Count == 0)
        {
            result.Add((
                "stress",
                (byte)Math.Clamp(comparison.Score, 0, 100),
                comparison.Score >= 85
                    ? "Phát âm tốt. Thử tăng tốc độ và nối âm tự nhiên hơn."
                    : "Chú ý trọng âm của từ và nhịp của cả câu."));
        }

        return result
            .GroupBy(x => x.Phoneme)
            .Select(g => g.First())
            .Take(12)
            .ToList();
    }

    private static PronunciationAttemptDto Map(
        PronunciationAttempt attempt,
        string? lemma,
        IReadOnlyList<SpeechWordResult> words,
        IReadOnlyList<string> tips) => new(
        attempt.Id,
        attempt.ReferenceText,
        attempt.WordId,
        lemma,
        attempt.OverallScore,
        attempt.AudioUrl,
        attempt.CreatedAt,
        attempt.PronunciationPhonemeScores
            .OrderBy(p => p.Score)
            .Select(p => new PhonemeScoreDto(p.Phoneme, p.Score, p.Feedback))
            .ToList(),
        words.Select(w => new SpeechWordDto(w.Word, w.Spoken, w.Correct)).ToList(),
        tips);
}
