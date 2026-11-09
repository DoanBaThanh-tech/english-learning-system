using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class WordPronunciation
{
    public int Id { get; set; }

    public int WordId { get; set; }

    public string Accent { get; set; } = null!;

    public string Ipa { get; set; } = null!;

    public string? AudioUrl { get; set; }

    public virtual Word Word { get; set; } = null!;
}
