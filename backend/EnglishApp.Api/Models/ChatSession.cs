using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class ChatSession
{
    public long Id { get; set; }

    public int UserId { get; set; }

    public int? ScenarioId { get; set; }

    public string? Title { get; set; }

    public DateTime CreatedAt { get; set; }

    public virtual ICollection<ChatMessage> ChatMessages { get; set; } = new List<ChatMessage>();

    public virtual ChatScenario? Scenario { get; set; }

    public virtual User User { get; set; } = null!;
}
