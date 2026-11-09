using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class User
{
    public int Id { get; set; }

    public string Email { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public string DisplayName { get; set; } = null!;

    public string? AvatarUrl { get; set; }

    public byte? CurrentLevelId { get; set; }

    public short DailyWordGoal { get; set; }

    public string TimeZoneId { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public bool IsActive { get; set; }

    public virtual ICollection<ChatSession> ChatSessions { get; set; } = new List<ChatSession>();

    public virtual Level? CurrentLevel { get; set; }

    public virtual ICollection<GeneratedLesson> GeneratedLessons { get; set; } = new List<GeneratedLesson>();

    public virtual ICollection<LearnerError> LearnerErrors { get; set; } = new List<LearnerError>();

    public virtual ICollection<LearningPlan> LearningPlans { get; set; } = new List<LearningPlan>();

    public virtual ICollection<PronunciationAttempt> PronunciationAttempts { get; set; } = new List<PronunciationAttempt>();

    public virtual ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();

    public virtual ICollection<Source> Sources { get; set; } = new List<Source>();

    public virtual ICollection<StudySession> StudySessions { get; set; } = new List<StudySession>();

    public virtual ICollection<Tag> Tags { get; set; } = new List<Tag>();

    public virtual ICollection<UserDailyStat> UserDailyStats { get; set; } = new List<UserDailyStat>();

    public virtual ICollection<UserPassageProgress> UserPassageProgresses { get; set; } = new List<UserPassageProgress>();

    public virtual ICollection<UserSkillScore> UserSkillScores { get; set; } = new List<UserSkillScore>();

    public virtual ICollection<UserWord> UserWords { get; set; } = new List<UserWord>();

    public virtual ICollection<WordFolder> WordFolders { get; set; } = new List<WordFolder>();
}
