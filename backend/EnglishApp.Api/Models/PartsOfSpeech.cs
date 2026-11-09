using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class PartsOfSpeech
{
    public byte Id { get; set; }

    public string Code { get; set; } = null!;

    public string NameVi { get; set; } = null!;

    public virtual ICollection<WordSense> WordSenses { get; set; } = new List<WordSense>();
}
