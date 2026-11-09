using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class SrsState
{
    public int UserWordId { get; set; }

    public decimal EaseFactor { get; set; }

    public int IntervalDays { get; set; }

    public int Repetitions { get; set; }

    public DateTime DueAt { get; set; }

    public virtual UserWord UserWord { get; set; } = null!;
}
