using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class PronunciationAttempt
{
    public long Id { get; set; }

    public int UserId { get; set; }

    public int? WordId { get; set; }

    public string ReferenceText { get; set; } = null!;

    public string? AudioUrl { get; set; }

    public byte OverallScore { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<LearnerError> LearnerErrors { get; set; } = new List<LearnerError>();

    public virtual ICollection<PronunciationPhonemeScore> PronunciationPhonemeScores { get; set; } = new List<PronunciationPhonemeScore>();

    public virtual User User { get; set; } = null!;

    public virtual Word? Word { get; set; }
}
