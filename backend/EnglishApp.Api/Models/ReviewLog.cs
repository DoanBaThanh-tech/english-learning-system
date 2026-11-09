using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class ReviewLog
{
    public long Id { get; set; }

    public int UserWordId { get; set; }

    public long? StudyAnswerId { get; set; }

    public byte Quality { get; set; }

    public int IntervalBefore { get; set; }

    public int IntervalAfter { get; set; }

    public DateTime ReviewedAt { get; set; }

    public virtual StudyAnswer? StudyAnswer { get; set; }

    public virtual UserWord UserWord { get; set; } = null!;
}
