using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class LearnerError
{
    public long Id { get; set; }

    public int UserId { get; set; }

    public byte SkillId { get; set; }

    public long? PronunciationAttemptId { get; set; }

    public long? ChatMessageId { get; set; }

    public long? StudyAnswerId { get; set; }

    public string Detail { get; set; } = null!;

    public string? Correction { get; set; }

    public bool IsResolved { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ChatMessage? ChatMessage { get; set; }

    public virtual PronunciationAttempt? PronunciationAttempt { get; set; }

    public virtual Skill Skill { get; set; } = null!;

    public virtual StudyAnswer? StudyAnswer { get; set; }

    public virtual User User { get; set; } = null!;
}
