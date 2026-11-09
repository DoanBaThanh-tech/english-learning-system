using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class ReadingPassage
{
    public int Id { get; set; }

    public byte LevelId { get; set; }

    public int? SourceId { get; set; }

    public string Title { get; set; } = null!;

    public string? Topic { get; set; }

    public string Body { get; set; } = null!;

    public virtual Level Level { get; set; } = null!;

    public virtual ICollection<PlanTask> PlanTasks { get; set; } = new List<PlanTask>();

    public virtual Source? Source { get; set; }

    public virtual ICollection<UserPassageProgress> UserPassageProgresses { get; set; } = new List<UserPassageProgress>();
}
