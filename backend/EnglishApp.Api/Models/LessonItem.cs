using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class LessonItem
{
    public int LessonId { get; set; }

    public int SenseId { get; set; }

    public short ItemOrder { get; set; }

    public string? ContextSentence { get; set; }

    public virtual GeneratedLesson Lesson { get; set; } = null!;

    public virtual WordSense Sense { get; set; } = null!;
}
