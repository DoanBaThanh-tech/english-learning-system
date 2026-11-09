using System.Text.RegularExpressions;
using EnglishApp.Api.Common.Exceptions;
using EnglishApp.Api.Common.Utilities;
using EnglishApp.Api.Data;
using EnglishApp.Api.DTOs.Study;
using EnglishApp.Api.DTOs.Vocabulary;
using EnglishApp.Api.Models;
using EnglishApp.Api.Repositories.Specific;
using EnglishApp.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishApp.Api.Services.Implementations;

/// <summary>
/// Phiên học và lặp lại ngắt quãng theo SM-2. Mỗi câu trả lời cập nhật
/// SrsState, ghi StudyAnswer + ReviewLog, và tạo LearnerError khi sai.
/// </summary>
public sealed class StudyService : IStudyService
{
    private readonly AppDbContext _db;
    private readonly IUserWordRepository _userWords;
    private readonly IProgressService _progress;
    private readonly IStatsService _stats;

    public StudyService(
        AppDbContext db,
        IUserWordRepository userWords,
        IProgressService progress,
        IStatsService stats)
    {
        _db = db;
        _userWords = userWords;
        _progress = progress;
        _stats = stats;
    }

    public async Task<StudySessionDto> StartAsync(
        int userId, StartSessionRequest request, CancellationToken ct = default)
    {
        var mode = string.IsNullOrWhiteSpace(request.Mode) ? "learn" : request.Mode;
        if (mode is not ("learn" or "review"))
        {
            throw new BadRequestException("Chế độ học chỉ có thể là learn hoặc review.");
        }

        var session = new StudySession
        {
            UserId = userId,
            Mode = mode,
            StartedAt = DateTime.UtcNow
        };

        _db.StudySessions.Add(session);
        await _db.SaveChangesAsync(ct);

        return new StudySessionDto(session.Id, session.Mode, session.StartedAt, null, 0, 0);
    }

    public async Task<StudySessionDto> GetSessionAsync(
        int userId, long sessionId, CancellationToken ct = default)
    {
        var session = await _db.StudySessions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId, ct)
            ?? throw new NotFoundException("Không tìm thấy phiên học.");

        var answered = await _db.StudyAnswers.CountAsync(a => a.SessionId == sessionId, ct);
        var correct = await _db.StudyAnswers.CountAsync(a => a.SessionId == sessionId && a.IsCorrect, ct);

        return new StudySessionDto(session.Id, session.Mode, session.StartedAt, session.EndedAt, answered, correct);
    }

    public async Task<IReadOnlyList<StudySessionDto>> ListAsync(
        int userId, int limit, CancellationToken ct = default)
    {
        var sessions = await _db.StudySessions
            .AsNoTracking()
            .Where(s => s.UserId == userId)
            .OrderByDescending(s => s.StartedAt)
            .Take(Math.Clamp(limit, 1, 50))
            .Select(s => new
            {
                s.Id,
                s.Mode,
                s.StartedAt,
                s.EndedAt,
                Answered = s.StudyAnswers.Count,
                Correct = s.StudyAnswers.Count(a => a.IsCorrect)
            })
            .ToListAsync(ct);

        return sessions.Select(s => new StudySessionDto(
            s.Id, s.Mode, s.StartedAt, s.EndedAt, s.Answered, s.Correct)).ToList();
    }

    public async Task<StudyCardDto?> NextAsync(
        int userId, long sessionId, string? exerciseType, CancellationToken ct = default)
    {
        var session = await _db.StudySessions
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId, ct)
            ?? throw new NotFoundException("Không tìm thấy phiên học.");

        if (session.EndedAt is not null)
        {
            throw new BadRequestException("Phiên học đã kết thúc.");
        }

        var answeredIds = await _db.StudyAnswers
            .Where(a => a.SessionId == sessionId)
            .Select(a => a.UserWordId)
            .Distinct()
            .ToListAsync(ct);

        var candidates = session.Mode == "review"
            ? await _userWords.GetDueAsync(userId, 100, ct)
            : await _userWords.GetNewAsync(userId, 100, ct);

        if (candidates.Count == 0)
        {
            candidates = await _userWords.GetDueAsync(userId, 100, ct);
        }

        var userWord = candidates.FirstOrDefault(uw => !answeredIds.Contains(uw.Id));
        if (userWord is null) return null;

        var type = await ResolveExerciseTypeAsync(
            exerciseType ?? (session.Mode == "review" ? "multiple_choice" : "flashcard"), ct);

        var meaning = BestMeaning(userWord);
        var lemma = userWord.Sense.Word.Lemma;
        var example = userWord.Sense.Examples.FirstOrDefault()?.SentenceEn;
        var context = userWord.ContextSentence ?? example;

        if (type.Code == "fill_blank" && !string.IsNullOrWhiteSpace(context))
        {
            context = Regex.Replace(context, $@"\b{Regex.Escape(lemma)}\w*\b", "____",
                RegexOptions.IgnoreCase, TimeSpan.FromSeconds(1));
        }

        var options = new List<string>();
        if (type.Code == "multiple_choice")
        {
            options = await BuildOptionsAsync(userId, userWord.SenseId, meaning, ct);
        }

        var us = userWord.Sense.Word.WordPronunciations.FirstOrDefault(p => p.Accent == "US");

        return new StudyCardDto(
            userWord.Id,
            userWord.SenseId,
            userWord.Sense.WordId,
            lemma,
            us?.Ipa,
            us?.AudioUrl,
            userWord.Sense.DefinitionEn,
            meaning,
            userWord.Sense.PartOfSpeech?.Code ?? "phrase",
            userWord.Sense.Level?.Code,
            context,
            type.Code,
            type.NameVi,
            options,
            userWord.SrsState is null ? null : new SrsDto(
                userWord.SrsState.DueAt,
                userWord.SrsState.IntervalDays,
                userWord.SrsState.Repetitions,
                userWord.SrsState.EaseFactor,
                userWord.SrsState.DueAt <= DateTime.UtcNow),
            userWord.Status);
    }

    public async Task<AnswerResultDto> SubmitAsync(
        int userId, long sessionId, SubmitAnswerRequest request, CancellationToken ct = default)
    {
        var session = await _db.StudySessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId, ct)
            ?? throw new NotFoundException("Không tìm thấy phiên học.");

        if (session.EndedAt is not null)
        {
            throw new BadRequestException("Phiên học đã kết thúc.");
        }

        var userWord = await _userWords.GetDetailAsync(request.UserWordId, userId, ct)
                       ?? throw new NotFoundException("Không tìm thấy từ cần chấm.");

        var type = await ResolveExerciseTypeAsync(request.ExerciseTypeCode, ct);
        var meaning = BestMeaning(userWord);
        var lemma = userWord.Sense.Word.Lemma;
        var reference = type.Code switch
        {
            "dictation" => userWord.ContextSentence ?? userWord.Sense.Examples.FirstOrDefault()?.SentenceEn ?? lemma,
            "fill_blank" => lemma,
            _ => meaning
        };

        var (isCorrect, quality) = Grade(type.Code, request, reference, meaning, lemma);

        var srs = userWord.SrsState;
        if (srs is null)
        {
            srs = new SrsState
            {
                UserWordId = userWord.Id,
                DueAt = DateTime.UtcNow,
                IntervalDays = 0,
                Repetitions = 0,
                EaseFactor = 2.5m
            };
            _db.SrsStates.Add(srs);
        }

        var intervalBefore = srs.IntervalDays;
        ApplySm2(srs, quality);

        var wasNew = userWord.Status == "new";
        userWord.Status = srs.Repetitions >= 5 && srs.IntervalDays >= 21
            ? "mastered"
            : "learning";

        var answer = new StudyAnswer
        {
            SessionId = sessionId,
            UserWordId = userWord.Id,
            ExerciseTypeId = type.Id,
            UserAnswer = TextUtil.Truncate(request.UserAnswer, 500),
            IsCorrect = isCorrect,
            ResponseMs = request.ResponseMs is null ? null : Math.Clamp(request.ResponseMs.Value, 0, 600_000),
            AnsweredAt = DateTime.UtcNow
        };

        _db.StudyAnswers.Add(answer);
        await _db.SaveChangesAsync(ct);

        _db.ReviewLogs.Add(new ReviewLog
        {
            UserWordId = userWord.Id,
            StudyAnswerId = answer.Id,
            Quality = (byte)quality,
            IntervalBefore = intervalBefore,
            IntervalAfter = srs.IntervalDays,
            ReviewedAt = DateTime.UtcNow
        });

        if (!isCorrect)
        {
            var skillId = await GetSkillIdAsync("vocabulary", ct);
            _db.LearnerErrors.Add(new LearnerError
            {
                UserId = userId,
                SkillId = skillId,
                StudyAnswerId = answer.Id,
                Detail = $"Trả lời sai khi ôn từ '{lemma}'.",
                Correction = $"Đáp án đúng: {reference}",
                IsResolved = false,
                CreatedAt = DateTime.UtcNow
            });
        }

        await _db.SaveChangesAsync(ct);

        var learned = session.Mode == "learn" && wasNew ? 1 : 0;
        var reviewed = session.Mode == "review" || !wasNew ? 1 : 0;
        await _progress.TouchAsync(userId, learned, reviewed, 0, ct);

        var message = isCorrect
            ? quality >= 5 ? "Chính xác và phản xạ rất nhanh." : "Chính xác. Từ sẽ quay lại đúng lịch."
            : $"Chưa đúng. Đáp án là: {reference}";

        return new AnswerResultDto(
            isCorrect,
            reference,
            quality,
            srs.DueAt,
            srs.IntervalDays,
            srs.Repetitions,
            message);
    }

    public async Task<StudySessionSummaryDto> FinishAsync(
        int userId, long sessionId, CancellationToken ct = default)
    {
        var session = await _db.StudySessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId, ct)
            ?? throw new NotFoundException("Không tìm thấy phiên học.");

        session.EndedAt ??= DateTime.UtcNow;
        await _db.SaveChangesAsync(ct);

        var answers = await _db.StudyAnswers
            .AsNoTracking()
            .Where(a => a.SessionId == sessionId)
            .ToListAsync(ct);

        var minutes = Math.Max(1, (int)Math.Round((session.EndedAt.Value - session.StartedAt).TotalMinutes));
        await _progress.TouchAsync(userId, 0, 0, minutes, ct);
        await _stats.RecalculateSkillsAsync(userId, ct);

        var correct = answers.Count(a => a.IsCorrect);
        var accuracy = answers.Count == 0 ? 0 : Math.Round(correct * 100.0 / answers.Count, 1);
        var learnedIds = answers.Select(a => a.UserWordId).Distinct().ToList();

        return new StudySessionSummaryDto(
            sessionId,
            session.Mode,
            session.StartedAt,
            session.EndedAt,
            minutes,
            answers.Count,
            correct,
            accuracy,
            learnedIds);
    }

    private async Task<ExerciseType> ResolveExerciseTypeAsync(string code, CancellationToken ct)
    {
        var normalized = string.IsNullOrWhiteSpace(code) ? "flashcard" : code.Trim().ToLowerInvariant();
        var types = await _db.ExerciseTypes.AsNoTracking().ToListAsync(ct);

        return types.FirstOrDefault(t => t.Code == normalized)
               ?? types.FirstOrDefault(t => t.Code == "flashcard")
               ?? throw new NotFoundException("Chưa cấu hình loại bài tập.");
    }

    private async Task<List<string>> BuildOptionsAsync(
        int userId, int senseId, string correct, CancellationToken ct)
    {
        var mine = await _db.UserWords
            .AsNoTracking()
            .Where(uw => uw.UserId == userId && uw.SenseId != senseId)
            .SelectMany(uw => uw.Sense.SenseTranslations.Select(t => t.MeaningVi))
            .Distinct()
            .Take(40)
            .ToListAsync(ct);

        var extra = await _db.SenseTranslations
            .AsNoTracking()
            .Where(t => t.SenseId != senseId)
            .Select(t => t.MeaningVi)
            .Distinct()
            .Take(60)
            .ToListAsync(ct);

        var options = mine.Concat(extra)
            .Where(m => !string.Equals(m, correct, StringComparison.OrdinalIgnoreCase))
            .Distinct()
            .OrderBy(_ => Random.Shared.Next())
            .Take(3)
            .Append(correct)
            .OrderBy(_ => Random.Shared.Next())
            .ToList();

        return options;
    }

    private static (bool IsCorrect, int Quality) Grade(
        string typeCode, SubmitAnswerRequest request, string reference, string meaning, string lemma)
    {
        if (request.Quality is not null)
        {
            var quality = Math.Clamp(request.Quality.Value, 0, 5);
            return (quality >= 3, quality);
        }

        var answer = TextUtil.NormalizeAnswer(request.UserAnswer);

        if (typeCode == "flashcard")
        {
            var rating = answer switch
            {
                "again" or "lại" or "sai" => 1,
                "hard" or "khó" => 3,
                "good" or "được" or "tốt" => 4,
                "easy" or "dễ" => 5,
                _ => (int?)null
            };

            if (rating is not null) return (rating >= 3, rating.Value);

            var ok = answer.Length > 0 &&
                     (answer == TextUtil.NormalizeAnswer(reference) ||
                      answer == TextUtil.NormalizeAnswer(meaning) ||
                      answer == TextUtil.NormalizeAnswer(lemma));
            return (ok, ok ? 4 : 2);
        }

        var correct = typeCode == "fill_blank"
            ? answer == TextUtil.NormalizeAnswer(lemma) || answer == TextUtil.NormalizeAnswer(meaning)
            : string.Equals(answer, TextUtil.NormalizeAnswer(reference), StringComparison.Ordinal);

        if (correct)
        {
            var fast = request.ResponseMs is not null && request.ResponseMs <= 6000;
            return (true, fast ? 5 : 4);
        }

        return (false, answer.Length == 0 ? 1 : 2);
    }

    private static void ApplySm2(SrsState srs, int quality)
    {
        var ease = srs.EaseFactor;

        if (quality < 3)
        {
            srs.Repetitions = 0;
            srs.IntervalDays = 1;
        }
        else
        {
            srs.Repetitions += 1;
            srs.IntervalDays = srs.Repetitions switch
            {
                1 => 1,
                2 => 6,
                _ => Math.Max(1, (int)Math.Round(srs.IntervalDays * ease))
            };
        }

        ease += 0.1m - (5 - quality) * (0.08m + (5 - quality) * 0.02m);
        srs.EaseFactor = Math.Clamp(ease, 1.3m, 3.0m);
        srs.DueAt = DateTime.UtcNow.AddDays(srs.IntervalDays);
    }

    private async Task<byte> GetSkillIdAsync(string code, CancellationToken ct) =>
        await _db.Skills.Where(s => s.Code == code).Select(s => s.Id).FirstOrDefaultAsync(ct);

    private static string BestMeaning(UserWord userWord) =>
        userWord.Sense.SenseTranslations
            .OrderByDescending(t => t.IsVerified)
            .Select(t => t.MeaningVi)
            .FirstOrDefault() ?? TextUtil.SimplifyMeaning(userWord.Sense.DefinitionEn);
}
