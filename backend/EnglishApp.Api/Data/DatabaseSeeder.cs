using EnglishApp.Api.Common.Auth;
using EnglishApp.Api.Common.Utilities;
using EnglishApp.Api.Data.Seed;
using EnglishApp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EnglishApp.Api.Data;

/// <summary>
/// Nạp dữ liệu tham chiếu (từ vựng curated, scenario, bài đọc) và một tài khoản demo
/// để mở Swagger/UI là dùng được ngay. Chạy lặp lại an toàn (idempotent).
/// </summary>
public sealed class DatabaseSeeder
{
    private readonly AppDbContext _db;
    private readonly IConfiguration _configuration;
    private readonly ILogger<DatabaseSeeder> _logger;

    public DatabaseSeeder(AppDbContext db, IConfiguration configuration, ILogger<DatabaseSeeder> logger)
    {
        _db = db;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SeedAsync(CancellationToken ct = default)
    {
        await SeedWordsAsync(ct);
        await SeedScenariosAsync(ct);
        await SeedPassagesAsync(ct);

        var seedDemo = _configuration.GetValue("Seed:DemoUser", true);
        if (seedDemo)
        {
            await SeedDemoUserAsync(ct);
        }

        _logger.LogInformation("Database seeding finished");
    }

    private async Task SeedWordsAsync(CancellationToken ct)
    {
        if (await _db.Words.AnyAsync(ct))
        {
            return;
        }

        var levels = await _db.Levels.ToDictionaryAsync(l => l.Code, l => l.Id, ct);
        var partsOfSpeech = await _db.PartsOfSpeeches.ToDictionaryAsync(p => p.Code, p => p.Id, ct);
        var now = DateTime.UtcNow;

        foreach (var seed in CuratedWordSeed.Words)
        {
            var word = new Word
            {
                Lemma = seed.Lemma,
                CreatedAt = now,
                WordPronunciations = new List<WordPronunciation>
                {
                    new() { Accent = "US", Ipa = seed.IpaUs },
                    new() { Accent = "UK", Ipa = seed.IpaUk }
                },
                WordSenses = seed.Senses.Select((sense, index) => new WordSense
                {
                    PartOfSpeechId = partsOfSpeech.GetValueOrDefault(sense.Pos, partsOfSpeech["phrase"]),
                    LevelId = levels.TryGetValue(sense.LevelCode, out var levelId) ? levelId : null,
                    DefinitionEn = sense.DefinitionEn,
                    SenseOrder = (short)(index + 1),
                    Source = "curated",
                    SenseTranslations = new List<SenseTranslation>
                    {
                        new() { MeaningVi = sense.MeaningVi, Source = "curated", IsVerified = true }
                    },
                    Examples = sense.Examples.Select(e => new Example
                    {
                        SentenceEn = e.En,
                        SentenceVi = e.Vi,
                        Source = "curated"
                    }).ToList()
                }).ToList()
            };

            _db.Words.Add(word);
        }

        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Seeded {Count} curated words", CuratedWordSeed.Words.Count);
    }

    private async Task SeedScenariosAsync(CancellationToken ct)
    {
        if (await _db.ChatScenarios.AnyAsync(ct))
        {
            return;
        }

        var levels = await _db.Levels.ToDictionaryAsync(l => l.Code, l => l.Id, ct);
        var scenarios = ContentSeed.Scenarios.Select(s => new ChatScenario
        {
            Name = s.Name,
            SystemPrompt = s.SystemPrompt,
            LevelId = levels.TryGetValue(s.LevelCode, out var id) ? id : null
        });

        _db.ChatScenarios.AddRange(scenarios);
        await _db.SaveChangesAsync(ct);
    }

    private async Task SeedPassagesAsync(CancellationToken ct)
    {
        if (await _db.ReadingPassages.AnyAsync(ct))
        {
            return;
        }

        var levels = await _db.Levels.ToDictionaryAsync(l => l.Code, l => l.Id, ct);
        var passages = ContentSeed.Passages.Select(p => new ReadingPassage
        {
            Title = p.Title,
            Topic = p.Topic,
            LevelId = levels.GetValueOrDefault(p.LevelCode, (byte)3),
            Body = p.Body
        });

        _db.ReadingPassages.AddRange(passages);
        await _db.SaveChangesAsync(ct);
    }

    private async Task SeedDemoUserAsync(CancellationToken ct)
    {
        if (await _db.Users.AnyAsync(ct))
        {
            return;
        }

        var levelId = await _db.Levels.Where(l => l.Code == "B1").Select(l => (byte?)l.Id).FirstOrDefaultAsync(ct);
        var user = new User
        {
            Email = "demo@skyword.dev",
            PasswordHash = PasswordHasher.Hash("Demo@12345"),
            DisplayName = "Minh Anh",
            CurrentLevelId = levelId,
            DailyWordGoal = 20,
            TimeZoneId = "SE Asia Standard Time",
            CreatedAt = DateTime.UtcNow,
            IsActive = true
        };
        _db.Users.Add(user);
        await _db.SaveChangesAsync(ct);

        var workFolder = new WordFolder { UserId = user.Id, Name = "OPC & công việc" };
        var travelFolder = new WordFolder { UserId = user.Id, Name = "Du lịch" };
        var dailyFolder = new WordFolder { UserId = user.Id, Name = "Đời sống" };
        _db.WordFolders.AddRange(workFolder, travelFolder, dailyFolder);

        var workTag = new Tag { UserId = user.Id, Name = "công việc" };
        var speakingTag = new Tag { UserId = user.Id, Name = "giao tiếp" };
        var examTag = new Tag { UserId = user.Id, Name = "ô thi" };
        _db.Tags.AddRange(workTag, speakingTag, examTag);
        await _db.SaveChangesAsync(ct);

        var words = await _db.Words
            .Include(w => w.WordSenses).ThenInclude(s => s.SenseTranslations)
            .ToListAsync(ct);

        int? SenseOf(string lemma, string meaning)
        {
            var word = words.FirstOrDefault(w => w.Lemma == lemma);
            return word?.WordSenses.FirstOrDefault(s =>
                s.SenseTranslations.Any(t => t.MeaningVi == meaning))?.Id;
        }

        var now = DateTime.UtcNow;
        var userWords = new List<UserWord>();

        void AddWord(int? senseId, string? context, string? note, int? folderId, string status,
            DateTime dueAt, int interval, int repetitions, decimal ease, params Tag[] tags)
        {
            if (senseId is null) return;

            var userWord = new UserWord
            {
                UserId = user.Id,
                SenseId = senseId.Value,
                ContextSentence = context,
                Note = note,
                FolderId = folderId,
                Status = status,
                AddedAt = now.AddDays(-Random.Shared.Next(1, 25)),
                SrsState = new SrsState
                {
                    DueAt = dueAt,
                    IntervalDays = interval,
                    Repetitions = repetitions,
                    EaseFactor = ease
                }
            };

            foreach (var tag in tags)
            {
                userWord.Tags.Add(tag);
            }

            userWords.Add(userWord);
        }

        AddWord(SenseOf("run", "điều hành"),
            "She runs a small café in District 1.", "run + business = điều hành, không phải chạy bộ",
            workFolder.Id, "learning", now.AddHours(-2), 3, 2, 2.5m, workTag);
        AddWord(SenseOf("book", "đặt trước"),
            "I booked a table for two.", "Phân biệt book (sách) và book (đặt trước)",
            travelFolder.Id, "learning", now.AddDays(1), 6, 3, 2.6m, speakingTag);
        AddWord(SenseOf("bank", "ngân hàng"),
            "I need to go to the bank to deposit money.", null,
            workFolder.Id, "mastered", now.AddDays(12), 21, 5, 2.7m, examTag);
        AddWord(SenseOf("light", "nhẹ"),
            "This backpack is very light.", "light: ánh sáng / nhẹ / nhạt",
            dailyFolder.Id, "learning", now.AddHours(-1), 1, 1, 2.4m, speakingTag);
        AddWord(SenseOf("work", "công việc"),
            "I have a lot of work today.", null,
            workFolder.Id, "mastered", now.AddDays(9), 15, 4, 2.6m, workTag);
        AddWord(SenseOf("address", "giải quyết"),
            "We must address this issue before launch.", "address a problem = giải quyết vấn đề",
            workFolder.Id, "learning", now.AddHours(-4), 2, 2, 2.5m, workTag);
        AddWord(SenseOf("spring", "mùa xuân"),
            "Flowers bloom in spring.", null,
            travelFolder.Id, "new", now, 0, 0, 2.5m);
        AddWord(SenseOf("sound", "có vẻ"),
            "That sounds like a good idea.", "sound + adjective = nghe có vẻ",
            dailyFolder.Id, "new", now, 0, 0, 2.5m);
        AddWord(SenseOf("mind", "phiền, ngại"),
            "Do you mind if I open the window?", null,
            dailyFolder.Id, "new", now, 0, 0, 2.5m);
        AddWord(SenseOf("order", "gọi món, đặt hàng"),
            "I ordered a coffee and a sandwich.", null,
            travelFolder.Id, "new", now, 0, 0, 2.5m);
        AddWord(SenseOf("charge", "sạc"),
            "I need to charge my phone before we leave.", "charge: tính phí / sạc / buộc tội",
            dailyFolder.Id, "new", now, 0, 0, 2.5m);
        AddWord(SenseOf("match", "hợp, phù hợp"),
            "This shirt matches your shoes perfectly.", null,
            dailyFolder.Id, "new", now, 0, 0, 2.5m);

        _db.UserWords.AddRange(userWords);
        await _db.SaveChangesAsync(ct);

        var today = DateOnly.FromDateTime(UserClock.Today(user.TimeZoneId));
        var learnedPattern = new[] { 12, 8, 0, 15, 20, 6, 18, 14, 9, 22, 11, 16, 7, 13 };
        for (var i = 13; i >= 0; i--)
        {
            var learned = (short)learnedPattern[13 - i];
            var reviewed = (short)(learned == 0 ? 0 : 4 + (i % 6));
            var minutes = (short)(learned == 0 ? 0 : 8 + (i % 10));
            _db.UserDailyStats.Add(new UserDailyStat
            {
                UserId = user.Id,
                StatDate = today.AddDays(-i),
                WordsLearned = learned,
                WordsReviewed = reviewed,
                MinutesStudied = minutes,
                GoalMet = learned >= user.DailyWordGoal
            });
        }

        var skills = await _db.Skills.ToDictionaryAsync(s => s.Code, s => s.Id, ct);
        var scoreValues = new Dictionary<string, decimal>
        {
            ["vocabulary"] = 62,
            ["listening"] = 55,
            ["speaking"] = 71,
            ["reading"] = 48,
            ["grammar"] = 58
        };

        foreach (var (code, score) in scoreValues)
        {
            if (skills.TryGetValue(code, out var skillId))
            {
                _db.UserSkillScores.Add(new UserSkillScore
                {
                    UserId = user.Id,
                    SkillId = skillId,
                    Score = score,
                    MeasuredAt = now
                });
            }
        }

        var scenario = await _db.ChatScenarios.OrderBy(s => s.Id).FirstOrDefaultAsync(ct);
        var passages = await _db.ReadingPassages.OrderBy(p => p.Id).Take(2).ToListAsync(ct);

        var plan = new LearningPlan
        {
            UserId = user.Id,
            StartDate = today,
            EndDate = today.AddDays(13),
            Status = "active"
        };
        _db.LearningPlans.Add(plan);
        await _db.SaveChangesAsync(ct);

        var skillTitle = new Dictionary<string, string>
        {
            ["vocabulary"] = "Học 10 từ mới theo ngữ cảnh",
            ["listening"] = "Nghe chép chính tả 5 phút",
            ["speaking"] = "Luyện nói cùng chatbot AI",
            ["reading"] = "Đọc hiểu bài B1 và lưu 5 từ",
            ["grammar"] = "Ôn 10 câu sai trong nhật ký lỗi"
        };

        var todayOffset = 0;
        foreach (var code in new[] { "vocabulary", "reading", "speaking", "vocabulary", "listening", "grammar" })
        {
            if (!skills.TryGetValue(code, out var skillId)) continue;

            _db.PlanTasks.Add(new PlanTask
            {
                PlanId = plan.Id,
                SkillId = skillId,
                Title = skillTitle[code],
                DueDate = today.AddDays(todayOffset % 4),
                IsDone = todayOffset == 0,
                PassageId = code == "reading" ? passages.FirstOrDefault()?.Id : null,
                ScenarioId = code == "speaking" ? scenario?.Id : null
            });
            todayOffset++;
        }

        if (scenario is not null)
        {
            var chat = new ChatSession
            {
                UserId = user.Id,
                ScenarioId = scenario.Id,
                Title = "Luyện gọi cà phê buổi sáng",
                CreatedAt = now.AddDays(-1)
            };
            var userMessage = new ChatMessage
            {
                Role = "user",
                Content = "I want a coffee with milk please.",
                CorrectedContent = "I would like a coffee with milk, please.",
                CreatedAt = now.AddDays(-1).AddMinutes(1)
            };
            chat.ChatMessages.Add(userMessage);
            chat.ChatMessages.Add(new ChatMessage
            {
                Role = "assistant",
                Content = "Of course! Would you like it hot or iced? We also have a special today: coconut coffee.",
                CreatedAt = now.AddDays(-1).AddMinutes(2)
            });
            _db.ChatSessions.Add(chat);
            await _db.SaveChangesAsync(ct);

            if (skills.TryGetValue("grammar", out var grammarId))
            {
                _db.LearnerErrors.Add(new LearnerError
                {
                    UserId = user.Id,
                    SkillId = grammarId,
                    ChatMessageId = userMessage.Id,
                    Detail = "Thiếu mạo từ và lời nói lịch sự khi gọi món.",
                    Correction = "I would like a coffee with milk, please.",
                    IsResolved = false,
                    CreatedAt = now.AddDays(-1).AddMinutes(1)
                });
            }
        }

        var runWordId = words.FirstOrDefault(w => w.Lemma == "run")?.Id;
        if (runWordId is not null)
        {
            var attempt = new PronunciationAttempt
            {
                UserId = user.Id,
                WordId = runWordId,
                ReferenceText = "She runs a small café in District 1.",
                OverallScore = 78,
                CreatedAt = now.AddDays(-1).AddHours(-2),
                PronunciationPhonemeScores = new List<PronunciationPhonemeScore>
                {
                    new() { Phoneme = "r", Score = 72, Feedback = "Uốn lưỡi nhẹ hơn cho /r/." },
                    new() { Phoneme = "ʌ", Score = 80, Feedback = "Mở miệng vừa, âm ngắn." },
                    new() { Phoneme = "n", Score = 66, Feedback = "Giữ âm cuối /n/ rõ hơn." }
                }
            };
            _db.PronunciationAttempts.Add(attempt);
            await _db.SaveChangesAsync(ct);

            if (skills.TryGetValue("speaking", out var speakingId))
            {
                _db.LearnerErrors.Add(new LearnerError
                {
                    UserId = user.Id,
                    SkillId = speakingId,
                    PronunciationAttemptId = attempt.Id,
                    Detail = "Âm cuối /n/ trong 'run' chưa rõ.",
                    Correction = "Chạm đầu lưỡi vào lợi khi kết thúc /n/.",
                    IsResolved = false,
                    CreatedAt = attempt.CreatedAt.AddMinutes(1)
                });
            }
        }

        if (passages.Count > 0)
        {
            _db.UserPassageProgresses.Add(new UserPassageProgress
            {
                UserId = user.Id,
                PassageId = passages[0].Id,
                ProgressPct = 35,
                LastReadAt = now.AddHours(-5)
            });
        }

        _db.StudySessions.Add(new StudySession
        {
            UserId = user.Id,
            Mode = "review",
            StartedAt = now.AddDays(-1).AddMinutes(-20),
            EndedAt = now.AddDays(-1).AddMinutes(-8)
        });

        await _db.SaveChangesAsync(ct);
        _logger.LogInformation("Seeded demo user demo@skyword.dev / Demo@12345");
    }
}
