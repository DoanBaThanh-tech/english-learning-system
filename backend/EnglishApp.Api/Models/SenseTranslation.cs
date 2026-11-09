using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class SenseTranslation
{
    public int Id { get; set; }

    public int SenseId { get; set; }

    public string MeaningVi { get; set; } = null!;

    public string? Source { get; set; }

    public bool IsVerified { get; set; }

    public virtual WordSense Sense { get; set; } = null!;
}
