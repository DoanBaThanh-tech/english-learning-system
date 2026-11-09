using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class Level
{
    public byte Id { get; set; }

    public string Code { get; set; } = null!;

    public string Name { get; set; } = null!;

    public virtual ICollection<ChatScenario> ChatScenarios { get; set; } = new List<ChatScenario>();

    public virtual ICollection<GeneratedLesson> GeneratedLessons { get; set; } = new List<GeneratedLesson>();

    public virtual ICollection<ReadingPassage> ReadingPassages { get; set; } = new List<ReadingPassage>();

    public virtual ICollection<User> Users { get; set; } = new List<User>();

    public virtual ICollection<WordSense> WordSenses { get; set; } = new List<WordSense>();
}
