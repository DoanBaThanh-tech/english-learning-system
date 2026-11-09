using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class LearningPlan
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public DateOnly StartDate { get; set; }

    public DateOnly EndDate { get; set; }

    public string Status { get; set; } = null!;

    public virtual ICollection<PlanTask> PlanTasks { get; set; } = new List<PlanTask>();

    public virtual User User { get; set; } = null!;
}
