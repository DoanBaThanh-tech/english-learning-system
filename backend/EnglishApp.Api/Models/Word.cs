using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class Word
{
    public int Id { get; set; }

    public string Lemma { get; set; } = null!;

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<PronunciationAttempt> PronunciationAttempts { get; set; } = new List<PronunciationAttempt>();

    public virtual ICollection<TranslationCache> TranslationCaches { get; set; } = new List<TranslationCache>();

    public virtual ICollection<WordPronunciation> WordPronunciations { get; set; } = new List<WordPronunciation>();

    public virtual ICollection<WordSense> WordSenses { get; set; } = new List<WordSense>();
}
