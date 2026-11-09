using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class WordFolder
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string Name { get; set; } = null!;

    public virtual User User { get; set; } = null!;

    public virtual ICollection<UserWord> UserWords { get; set; } = new List<UserWord>();
}
