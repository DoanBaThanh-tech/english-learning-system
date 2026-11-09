using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class ChatMessage
{
    public long Id { get; set; }

    public long SessionId { get; set; }

    public string Role { get; set; } = null!;

    public string Content { get; set; } = null!;

    public string? CorrectedContent { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<LearnerError> LearnerErrors { get; set; } = new List<LearnerError>();

    public virtual ChatSession Session { get; set; } = null!;
}
