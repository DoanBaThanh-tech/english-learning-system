using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class Source
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string SourceType { get; set; } = null!;

    public string Title { get; set; } = null!;

    public string? Url { get; set; }

    public string? Content { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<GeneratedLesson> GeneratedLessons { get; set; } = new List<GeneratedLesson>();

    public virtual ICollection<ReadingPassage> ReadingPassages { get; set; } = new List<ReadingPassage>();

    public virtual User User { get; set; } = null!;

    public virtual ICollection<UserWord> UserWords { get; set; } = new List<UserWord>();
}
