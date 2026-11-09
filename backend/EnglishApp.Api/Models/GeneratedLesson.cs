using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class GeneratedLesson
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int? SourceId { get; set; }

    public byte? LevelId { get; set; }

    public string Title { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<LessonItem> LessonItems { get; set; } = new List<LessonItem>();

    public virtual Level? Level { get; set; }

    public virtual ICollection<PlanTask> PlanTasks { get; set; } = new List<PlanTask>();

    public virtual Source? Source { get; set; }

    public virtual User User { get; set; } = null!;
}
