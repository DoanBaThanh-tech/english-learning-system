using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class Example
{
    public int Id { get; set; }

    public int SenseId { get; set; }

    public string SentenceEn { get; set; } = null!;

    public string? SentenceVi { get; set; }

    public string? Source { get; set; }

    public virtual WordSense Sense { get; set; } = null!;
}
