using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class UserPassageProgress
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int PassageId { get; set; }

    public byte ProgressPct { get; set; }

    public DateTime LastReadAt { get; set; }

    public virtual ReadingPassage Passage { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
