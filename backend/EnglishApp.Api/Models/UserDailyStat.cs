using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class UserDailyStat
{
    public long Id { get; set; }

    public int UserId { get; set; }

    public DateOnly StatDate { get; set; }

    public short WordsLearned { get; set; }

    public short WordsReviewed { get; set; }

    public short MinutesStudied { get; set; }

    public bool GoalMet { get; set; }

    public virtual User User { get; set; } = null!;
}
