using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class ChatScenario
{
    public int Id { get; set; }

    public byte? LevelId { get; set; }

    public string Name { get; set; } = null!;

    public string SystemPrompt { get; set; } = null!;

    public virtual ICollection<ChatSession> ChatSessions { get; set; } = new List<ChatSession>();

    public virtual Level? Level { get; set; }

    public virtual ICollection<PlanTask> PlanTasks { get; set; } = new List<PlanTask>();
}
