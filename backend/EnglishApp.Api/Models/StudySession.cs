using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class StudySession
{
    public long Id { get; set; }

    public int UserId { get; set; }

    public string Mode { get; set; } = null!;

    public DateTime StartedAt { get; set; }

    public DateTime? EndedAt { get; set; }

    public virtual ICollection<StudyAnswer> StudyAnswers { get; set; } = new List<StudyAnswer>();

    public virtual User User { get; set; } = null!;
}
