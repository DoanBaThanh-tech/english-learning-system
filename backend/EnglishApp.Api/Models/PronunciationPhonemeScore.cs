using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class PronunciationPhonemeScore
{
    public long Id { get; set; }

    public long AttemptId { get; set; }

    public string Phoneme { get; set; } = null!;

    public byte Score { get; set; }

    public string? Feedback { get; set; }

    public virtual PronunciationAttempt Attempt { get; set; } = null!;
}
