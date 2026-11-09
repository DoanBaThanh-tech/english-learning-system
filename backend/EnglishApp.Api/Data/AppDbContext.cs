using System;
using System.Collections.Generic;
using EnglishApp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EnglishApp.Api.Data;

public partial class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<ChatMessage> ChatMessages { get; set; }

    public virtual DbSet<ChatScenario> ChatScenarios { get; set; }

    public virtual DbSet<ChatSession> ChatSessions { get; set; }

    public virtual DbSet<Example> Examples { get; set; }

    public virtual DbSet<ExerciseType> ExerciseTypes { get; set; }

    public virtual DbSet<GeneratedLesson> GeneratedLessons { get; set; }

    public virtual DbSet<LearnerError> LearnerErrors { get; set; }

    public virtual DbSet<LearningPlan> LearningPlans { get; set; }

    public virtual DbSet<LessonItem> LessonItems { get; set; }

    public virtual DbSet<Level> Levels { get; set; }

    public virtual DbSet<PartsOfSpeech> PartsOfSpeeches { get; set; }

    public virtual DbSet<PlanTask> PlanTasks { get; set; }

    public virtual DbSet<PronunciationAttempt> PronunciationAttempts { get; set; }

    public virtual DbSet<PronunciationPhonemeScore> PronunciationPhonemeScores { get; set; }

    public virtual DbSet<ReadingPassage> ReadingPassages { get; set; }

    public virtual DbSet<RefreshToken> RefreshTokens { get; set; }

    public virtual DbSet<ReviewLog> ReviewLogs { get; set; }

    public virtual DbSet<SenseTranslation> SenseTranslations { get; set; }

    public virtual DbSet<Skill> Skills { get; set; }

    public virtual DbSet<Source> Sources { get; set; }

    public virtual DbSet<SrsState> SrsStates { get; set; }

    public virtual DbSet<StudyAnswer> StudyAnswers { get; set; }

    public virtual DbSet<StudySession> StudySessions { get; set; }

    public virtual DbSet<Tag> Tags { get; set; }

    public virtual DbSet<TranslationCache> TranslationCaches { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<UserDailyStat> UserDailyStats { get; set; }

    public virtual DbSet<UserPassageProgress> UserPassageProgresses { get; set; }

    public virtual DbSet<UserSkillScore> UserSkillScores { get; set; }

    public virtual DbSet<UserWord> UserWords { get; set; }

    public virtual DbSet<Word> Words { get; set; }

    public virtual DbSet<WordFolder> WordFolders { get; set; }

    public virtual DbSet<WordPronunciation> WordPronunciations { get; set; }

    public virtual DbSet<WordSense> WordSenses { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ChatMessage>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ChatMess__3214EC07136F9774");

            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Role).HasMaxLength(10);

            entity.HasOne(d => d.Session).WithMany(p => p.ChatMessages)
                .HasForeignKey(d => d.SessionId)
                .HasConstraintName("FK__ChatMessa__Sessi__5F7E2DAC");
        });

        modelBuilder.Entity<ChatScenario>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ChatScen__3214EC07CF69BC41");

            entity.Property(e => e.Name).HasMaxLength(100);

            entity.HasOne(d => d.Level).WithMany(p => p.ChatScenarios)
                .HasForeignKey(d => d.LevelId)
                .HasConstraintName("FK__ChatScena__Level__57DD0BE4");
        });

        modelBuilder.Entity<ChatSession>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ChatSess__3214EC077807334B");

            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Title).HasMaxLength(200);

            entity.HasOne(d => d.Scenario).WithMany(p => p.ChatSessions)
                .HasForeignKey(d => d.ScenarioId)
                .HasConstraintName("FK__ChatSessi__Scena__5BAD9CC8");

            entity.HasOne(d => d.User).WithMany(p => p.ChatSessions)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__ChatSessi__UserI__5AB9788F");
        });

        modelBuilder.Entity<Example>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Examples__3214EC0778F9EAA8");

            entity.Property(e => e.SentenceEn).HasMaxLength(1000);
            entity.Property(e => e.SentenceVi).HasMaxLength(1000);
            entity.Property(e => e.Source).HasMaxLength(50);

            entity.HasOne(d => d.Sense).WithMany(p => p.Examples)
                .HasForeignKey(d => d.SenseId)
                .HasConstraintName("FK__Examples__SenseI__7E37BEF6");
        });

        modelBuilder.Entity<ExerciseType>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Exercise__3214EC07F6CDC0AF");

            entity.HasIndex(e => e.Code, "UQ__Exercise__A25C5AA7C9A49C23").IsUnique();

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Code).HasMaxLength(30);
            entity.Property(e => e.NameVi).HasMaxLength(60);
        });

        modelBuilder.Entity<GeneratedLesson>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Generate__3214EC07115F348F");

            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Title).HasMaxLength(300);

            entity.HasOne(d => d.Level).WithMany(p => p.GeneratedLessons)
                .HasForeignKey(d => d.LevelId)
                .HasConstraintName("FK__Generated__Level__19DFD96B");

            entity.HasOne(d => d.Source).WithMany(p => p.GeneratedLessons)
                .HasForeignKey(d => d.SourceId)
                .HasConstraintName("FK__Generated__Sourc__18EBB532");

            entity.HasOne(d => d.User).WithMany(p => p.GeneratedLessons)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__Generated__UserI__17F790F9");
        });

        modelBuilder.Entity<LearnerError>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__LearnerE__3214EC075EDED658");

            entity.Property(e => e.Correction).HasMaxLength(500);
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Detail).HasMaxLength(500);

            entity.HasOne(d => d.ChatMessage).WithMany(p => p.LearnerErrors)
                .HasForeignKey(d => d.ChatMessageId)
                .HasConstraintName("FK__LearnerEr__ChatM__671F4F74");

            entity.HasOne(d => d.PronunciationAttempt).WithMany(p => p.LearnerErrors)
                .HasForeignKey(d => d.PronunciationAttemptId)
                .HasConstraintName("FK__LearnerEr__Pronu__662B2B3B");

            entity.HasOne(d => d.Skill).WithMany(p => p.LearnerErrors)
                .HasForeignKey(d => d.SkillId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__LearnerEr__Skill__65370702");

            entity.HasOne(d => d.StudyAnswer).WithMany(p => p.LearnerErrors)
                .HasForeignKey(d => d.StudyAnswerId)
                .HasConstraintName("FK__LearnerEr__Study__681373AD");

            entity.HasOne(d => d.User).WithMany(p => p.LearnerErrors)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__LearnerEr__UserI__6442E2C9");
        });

        modelBuilder.Entity<LearningPlan>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Learning__3214EC072B33BC26");

            entity.Property(e => e.Status)
                .HasMaxLength(10)
                .HasDefaultValue("active");

            entity.HasOne(d => d.User).WithMany(p => p.LearningPlans)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__LearningP__UserI__73852659");
        });

        modelBuilder.Entity<LessonItem>(entity =>
        {
            entity.HasKey(e => new { e.LessonId, e.SenseId }).HasName("PK__LessonIt__F2461B7DB8853FF1");

            entity.Property(e => e.ContextSentence).HasMaxLength(1000);

            entity.HasOne(d => d.Lesson).WithMany(p => p.LessonItems)
                .HasForeignKey(d => d.LessonId)
                .HasConstraintName("FK__LessonIte__Lesso__1DB06A4F");

            entity.HasOne(d => d.Sense).WithMany(p => p.LessonItems)
                .HasForeignKey(d => d.SenseId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__LessonIte__Sense__1EA48E88");
        });

        modelBuilder.Entity<Level>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Levels__3214EC078158F6F2");

            entity.HasIndex(e => e.Code, "UQ__Levels__A25C5AA74F506EC4").IsUnique();

            entity.Property(e => e.Code).HasMaxLength(2);
            entity.Property(e => e.Name).HasMaxLength(50);
        });

        modelBuilder.Entity<PartsOfSpeech>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__PartsOfS__3214EC07E3157A1E");

            entity.ToTable("PartsOfSpeech");

            entity.HasIndex(e => e.Code, "UQ__PartsOfS__A25C5AA77FB09B4D").IsUnique();

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Code).HasMaxLength(20);
            entity.Property(e => e.NameVi).HasMaxLength(50);
        });

        modelBuilder.Entity<PlanTask>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__PlanTask__3214EC07FA6DE900");

            entity.Property(e => e.Title).HasMaxLength(200);

            entity.HasOne(d => d.Lesson).WithMany(p => p.PlanTasks)
                .HasForeignKey(d => d.LessonId)
                .HasConstraintName("FK__PlanTasks__Lesso__7C1A6C5A");

            entity.HasOne(d => d.Passage).WithMany(p => p.PlanTasks)
                .HasForeignKey(d => d.PassageId)
                .HasConstraintName("FK__PlanTasks__Passa__7D0E9093");

            entity.HasOne(d => d.Plan).WithMany(p => p.PlanTasks)
                .HasForeignKey(d => d.PlanId)
                .HasConstraintName("FK__PlanTasks__PlanI__793DFFAF");

            entity.HasOne(d => d.Scenario).WithMany(p => p.PlanTasks)
                .HasForeignKey(d => d.ScenarioId)
                .HasConstraintName("FK__PlanTasks__Scena__7E02B4CC");

            entity.HasOne(d => d.Skill).WithMany(p => p.PlanTasks)
                .HasForeignKey(d => d.SkillId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__PlanTasks__Skill__7A3223E8");
        });

        modelBuilder.Entity<PronunciationAttempt>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Pronunci__3214EC07837B2418");

            entity.Property(e => e.AudioUrl).HasMaxLength(500);
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.ReferenceText).HasMaxLength(500);

            entity.HasOne(d => d.User).WithMany(p => p.PronunciationAttempts)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__Pronuncia__UserI__4E53A1AA");

            entity.HasOne(d => d.Word).WithMany(p => p.PronunciationAttempts)
                .HasForeignKey(d => d.WordId)
                .HasConstraintName("FK__Pronuncia__WordI__4F47C5E3");
        });

        modelBuilder.Entity<PronunciationPhonemeScore>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Pronunci__3214EC0797AF3F44");

            entity.Property(e => e.Feedback).HasMaxLength(300);
            entity.Property(e => e.Phoneme).HasMaxLength(10);

            entity.HasOne(d => d.Attempt).WithMany(p => p.PronunciationPhonemeScores)
                .HasForeignKey(d => d.AttemptId)
                .HasConstraintName("FK__Pronuncia__Attem__540C7B00");
        });

        modelBuilder.Entity<ReadingPassage>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ReadingP__3214EC07AF595B5F");

            entity.Property(e => e.Title).HasMaxLength(300);
            entity.Property(e => e.Topic).HasMaxLength(100);

            entity.HasOne(d => d.Level).WithMany(p => p.ReadingPassages)
                .HasForeignKey(d => d.LevelId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__ReadingPa__Level__0C85DE4D");

            entity.HasOne(d => d.Source).WithMany(p => p.ReadingPassages)
                .HasForeignKey(d => d.SourceId)
                .HasConstraintName("FK__ReadingPa__Sourc__0D7A0286");
        });

        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__RefreshT__3214EC071009FC58");

            entity.HasIndex(e => e.TokenHash, "UQ__RefreshT__BCB33F9202C06285").IsUnique();

            entity.Property(e => e.ExpiresAt).HasPrecision(0);
            entity.Property(e => e.RevokedAt).HasPrecision(0);
            entity.Property(e => e.TokenHash)
                .HasMaxLength(32)
                .IsFixedLength();

            entity.HasOne(d => d.User).WithMany(p => p.RefreshTokens)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__RefreshTo__UserI__5FB337D6");
        });

        modelBuilder.Entity<ReviewLog>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__ReviewLo__3214EC07BC517C81");

            entity.HasIndex(e => new { e.UserWordId, e.ReviewedAt }, "IX_ReviewLogs");

            entity.Property(e => e.ReviewedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.StudyAnswer).WithMany(p => p.ReviewLogs)
                .HasForeignKey(d => d.StudyAnswerId)
                .HasConstraintName("FK__ReviewLog__Study__498EEC8D");

            entity.HasOne(d => d.UserWord).WithMany(p => p.ReviewLogs)
                .HasForeignKey(d => d.UserWordId)
                .HasConstraintName("FK__ReviewLog__UserW__489AC854");
        });

        modelBuilder.Entity<SenseTranslation>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__SenseTra__3214EC074B1653F9");

            entity.HasIndex(e => new { e.SenseId, e.MeaningVi }, "UQ_SenseTrans").IsUnique();

            entity.Property(e => e.MeaningVi).HasMaxLength(500);
            entity.Property(e => e.Source).HasMaxLength(50);

            entity.HasOne(d => d.Sense).WithMany(p => p.SenseTranslations)
                .HasForeignKey(d => d.SenseId)
                .HasConstraintName("FK__SenseTran__Sense__7A672E12");
        });

        modelBuilder.Entity<Skill>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Skills__3214EC0735AC41E9");

            entity.HasIndex(e => e.Code, "UQ__Skills__A25C5AA7382B6D27").IsUnique();

            entity.Property(e => e.Id).ValueGeneratedNever();
            entity.Property(e => e.Code).HasMaxLength(30);
            entity.Property(e => e.NameVi).HasMaxLength(60);
        });

        modelBuilder.Entity<Source>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Sources__3214EC07A73C92DC");

            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.SourceType).HasMaxLength(20);
            entity.Property(e => e.Title).HasMaxLength(300);
            entity.Property(e => e.Url).HasMaxLength(1000);

            entity.HasOne(d => d.User).WithMany(p => p.Sources)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__Sources__UserId__07C12930");
        });

        modelBuilder.Entity<SrsState>(entity =>
        {
            entity.HasKey(e => e.UserWordId).HasName("PK__SrsState__6E1BC12F5005BAFA");

            entity.HasIndex(e => e.DueAt, "IX_Srs_Due");

            entity.Property(e => e.UserWordId).ValueGeneratedNever();
            entity.Property(e => e.DueAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.EaseFactor)
                .HasDefaultValue(2.50m)
                .HasColumnType("decimal(4, 2)");

            entity.HasOne(d => d.UserWord).WithOne(p => p.SrsState)
                .HasForeignKey<SrsState>(d => d.UserWordId)
                .HasConstraintName("FK__SrsStates__UserW__367C1819");
        });

        modelBuilder.Entity<StudyAnswer>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__StudyAns__3214EC07E5F42803");

            entity.Property(e => e.AnsweredAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.UserAnswer).HasMaxLength(500);

            entity.HasOne(d => d.ExerciseType).WithMany(p => p.StudyAnswers)
                .HasForeignKey(d => d.ExerciseTypeId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__StudyAnsw__Exerc__44CA3770");

            entity.HasOne(d => d.Session).WithMany(p => p.StudyAnswers)
                .HasForeignKey(d => d.SessionId)
                .HasConstraintName("FK__StudyAnsw__Sessi__42E1EEFE");

            entity.HasOne(d => d.UserWord).WithMany(p => p.StudyAnswers)
                .HasForeignKey(d => d.UserWordId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__StudyAnsw__UserW__43D61337");
        });

        modelBuilder.Entity<StudySession>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__StudySes__3214EC07D77CD13D");

            entity.Property(e => e.EndedAt).HasPrecision(0);
            entity.Property(e => e.Mode).HasMaxLength(10);
            entity.Property(e => e.StartedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.User).WithMany(p => p.StudySessions)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__StudySess__UserI__3E1D39E1");
        });

        modelBuilder.Entity<Tag>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Tags__3214EC0727DC2423");

            entity.HasIndex(e => new { e.UserId, e.Name }, "UQ_Tag").IsUnique();

            entity.Property(e => e.Name).HasMaxLength(50);

            entity.HasOne(d => d.User).WithMany(p => p.Tags)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__Tags__UserId__2645B050");
        });

        modelBuilder.Entity<TranslationCache>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Translat__3214EC0712D14A01");

            entity.ToTable("TranslationCache");

            entity.HasIndex(e => new { e.WordId, e.SentenceHash }, "UQ_TransCache").IsUnique();

            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.MeaningVi).HasMaxLength(500);
            entity.Property(e => e.Model).HasMaxLength(50);
            entity.Property(e => e.SentenceHash)
                .HasMaxLength(32)
                .IsFixedLength();
            entity.Property(e => e.SentenceText).HasMaxLength(1000);

            entity.HasOne(d => d.ChosenSense).WithMany(p => p.TranslationCaches)
                .HasForeignKey(d => d.ChosenSenseId)
                .HasConstraintName("FK__Translati__Chose__02FC7413");

            entity.HasOne(d => d.Word).WithMany(p => p.TranslationCaches)
                .HasForeignKey(d => d.WordId)
                .HasConstraintName("FK__Translati__WordI__02084FDA");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Users__3214EC07DB7DDF39");

            entity.HasIndex(e => e.Email, "UQ__Users__A9D10534FD87BA90").IsUnique();

            entity.Property(e => e.AvatarUrl).HasMaxLength(500);
            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.DailyWordGoal).HasDefaultValue((short)20);
            entity.Property(e => e.DisplayName).HasMaxLength(100);
            entity.Property(e => e.Email).HasMaxLength(256);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.PasswordHash).HasMaxLength(255);
            entity.Property(e => e.TimeZoneId)
                .HasMaxLength(64)
                .HasDefaultValue("SE Asia Standard Time");

            entity.HasOne(d => d.CurrentLevel).WithMany(p => p.Users)
                .HasForeignKey(d => d.CurrentLevelId)
                .HasConstraintName("FK__Users__CurrentLe__571DF1D5");
        });

        modelBuilder.Entity<UserDailyStat>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__UserDail__3214EC0757636FCC");

            entity.HasIndex(e => new { e.UserId, e.StatDate }, "UQ_DailyStats").IsUnique();

            entity.HasOne(d => d.User).WithMany(p => p.UserDailyStats)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__UserDaily__UserI__6383C8BA");
        });

        modelBuilder.Entity<UserPassageProgress>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__UserPass__3214EC0774DF66ED");

            entity.ToTable("UserPassageProgress");

            entity.HasIndex(e => new { e.UserId, e.PassageId }, "UQ_UserPassage").IsUnique();

            entity.Property(e => e.LastReadAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");

            entity.HasOne(d => d.Passage).WithMany(p => p.UserPassageProgresses)
                .HasForeignKey(d => d.PassageId)
                .HasConstraintName("FK__UserPassa__Passa__123EB7A3");

            entity.HasOne(d => d.User).WithMany(p => p.UserPassageProgresses)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__UserPassa__UserI__114A936A");
        });

        modelBuilder.Entity<UserSkillScore>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__UserSkil__3214EC07A46E1EB5");

            entity.Property(e => e.MeasuredAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Score).HasColumnType("decimal(5, 2)");

            entity.HasOne(d => d.Skill).WithMany(p => p.UserSkillScores)
                .HasForeignKey(d => d.SkillId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__UserSkill__Skill__6EC0713C");

            entity.HasOne(d => d.User).WithMany(p => p.UserSkillScores)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__UserSkill__UserI__6DCC4D03");
        });

        modelBuilder.Entity<UserWord>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__UserWord__3214EC07C87BA0EF");

            entity.HasIndex(e => new { e.UserId, e.SenseId }, "UQ_UserSense").IsUnique();

            entity.Property(e => e.AddedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.ContextSentence).HasMaxLength(1000);
            entity.Property(e => e.Note).HasMaxLength(500);
            entity.Property(e => e.Status)
                .HasMaxLength(10)
                .HasDefaultValue("new");

            entity.HasOne(d => d.Folder).WithMany(p => p.UserWords)
                .HasForeignKey(d => d.FolderId)
                .HasConstraintName("FK__UserWords__Folde__2BFE89A6");

            entity.HasOne(d => d.Sense).WithMany(p => p.UserWords)
                .HasForeignKey(d => d.SenseId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__UserWords__Sense__2B0A656D");

            entity.HasOne(d => d.Source).WithMany(p => p.UserWords)
                .HasForeignKey(d => d.SourceId)
                .HasConstraintName("FK__UserWords__Sourc__2CF2ADDF");

            entity.HasOne(d => d.User).WithMany(p => p.UserWords)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__UserWords__UserI__2A164134");

            entity.HasMany(d => d.Tags).WithMany(p => p.UserWords)
                .UsingEntity<Dictionary<string, object>>(
                    "UserWordTag",
                    r => r.HasOne<Tag>().WithMany()
                        .HasForeignKey("TagId")
                        .OnDelete(DeleteBehavior.ClientSetNull)
                        .HasConstraintName("FK__UserWordT__TagId__339FAB6E"),
                    l => l.HasOne<UserWord>().WithMany()
                        .HasForeignKey("UserWordId")
                        .HasConstraintName("FK__UserWordT__UserW__32AB8735"),
                    j =>
                    {
                        j.HasKey("UserWordId", "TagId").HasName("PK__UserWord__B84C0EB5E47CE3E7");
                        j.ToTable("UserWordTags");
                    });
        });

        modelBuilder.Entity<Word>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__Words__3214EC070206C78E");

            entity.HasIndex(e => e.Lemma, "UQ__Words__B7C63809B52D977C").IsUnique();

            entity.Property(e => e.CreatedAt)
                .HasPrecision(0)
                .HasDefaultValueSql("(sysutcdatetime())");
            entity.Property(e => e.Lemma).HasMaxLength(100);
        });

        modelBuilder.Entity<WordFolder>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__WordFold__3214EC07FC8FA61F");

            entity.HasIndex(e => new { e.UserId, e.Name }, "UQ_Folder").IsUnique();

            entity.Property(e => e.Name).HasMaxLength(100);

            entity.HasOne(d => d.User).WithMany(p => p.WordFolders)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK__WordFolde__UserI__22751F6C");
        });

        modelBuilder.Entity<WordPronunciation>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__WordPron__3214EC0793481786");

            entity.HasIndex(e => new { e.WordId, e.Accent }, "UQ_WordAccent").IsUnique();

            entity.Property(e => e.Accent)
                .HasMaxLength(2)
                .IsUnicode(false)
                .IsFixedLength();
            entity.Property(e => e.AudioUrl).HasMaxLength(500);
            entity.Property(e => e.Ipa).HasMaxLength(100);

            entity.HasOne(d => d.Word).WithMany(p => p.WordPronunciations)
                .HasForeignKey(d => d.WordId)
                .HasConstraintName("FK__WordPronu__WordI__6EF57B66");
        });

        modelBuilder.Entity<WordSense>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__WordSens__3214EC0713D071C2");

            entity.HasIndex(e => new { e.WordId, e.SenseOrder }, "UQ_SenseOrder").IsUnique();

            entity.Property(e => e.DefinitionEn).HasMaxLength(1000);
            entity.Property(e => e.SenseOrder).HasDefaultValue((short)1);
            entity.Property(e => e.Source).HasMaxLength(50);

            entity.HasOne(d => d.Level).WithMany(p => p.WordSenses)
                .HasForeignKey(d => d.LevelId)
                .HasConstraintName("FK__WordSense__Level__75A278F5");

            entity.HasOne(d => d.PartOfSpeech).WithMany(p => p.WordSenses)
                .HasForeignKey(d => d.PartOfSpeechId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK__WordSense__PartO__74AE54BC");

            entity.HasOne(d => d.Word).WithMany(p => p.WordSenses)
                .HasForeignKey(d => d.WordId)
                .HasConstraintName("FK__WordSense__WordI__73BA3083");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
