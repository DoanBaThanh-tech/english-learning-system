using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class StudyAnswer
{
    public long Id { get; set; }

    public long SessionId { get; set; }

    public int UserWordId { get; set; }

    public byte ExerciseTypeId { get; set; }

    public string? UserAnswer { get; set; }

    public bool IsCorrect { get; set; }

    public int? ResponseMs { get; set; }

    public DateTime AnsweredAt { get; set; }

    public virtual ExerciseType ExerciseType { get; set; } = null!;

    public virtual ICollection<LearnerError> LearnerErrors { get; set; } = new List<LearnerError>();

    public virtual ICollection<ReviewLog> ReviewLogs { get; set; } = new List<ReviewLog>();

    public virtual StudySession Session { get; set; } = null!;

    public virtual UserWord UserWord { get; set; } = null!;
}
