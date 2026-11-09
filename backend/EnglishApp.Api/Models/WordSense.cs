using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class WordSense
{
    public int Id { get; set; }

    public int WordId { get; set; }

    public byte PartOfSpeechId { get; set; }

    public byte? LevelId { get; set; }

    public string DefinitionEn { get; set; } = null!;

    public short SenseOrder { get; set; }

    public string? Source { get; set; }

    public virtual ICollection<Example> Examples { get; set; } = new List<Example>();

    public virtual ICollection<LessonItem> LessonItems { get; set; } = new List<LessonItem>();

    public virtual Level? Level { get; set; }

    public virtual PartsOfSpeech PartOfSpeech { get; set; } = null!;

    public virtual ICollection<SenseTranslation> SenseTranslations { get; set; } = new List<SenseTranslation>();

    public virtual ICollection<TranslationCache> TranslationCaches { get; set; } = new List<TranslationCache>();

    public virtual ICollection<UserWord> UserWords { get; set; } = new List<UserWord>();

    public virtual Word Word { get; set; } = null!;
}
