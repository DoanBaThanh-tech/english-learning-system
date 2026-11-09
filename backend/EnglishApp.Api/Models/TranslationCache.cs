using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class TranslationCache
{
    public long Id { get; set; }

    public int WordId { get; set; }

    public byte[] SentenceHash { get; set; } = null!;

    public string SentenceText { get; set; } = null!;

    public int? ChosenSenseId { get; set; }

    public string MeaningVi { get; set; } = null!;

    public byte? ConfidencePct { get; set; }

    public string? Model { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual WordSense? ChosenSense { get; set; }

    public virtual Word Word { get; set; } = null!;
}
