using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class Skill
{
    public byte Id { get; set; }

    public string Code { get; set; } = null!;

    public string NameVi { get; set; } = null!;

    public virtual ICollection<LearnerError> LearnerErrors { get; set; } = new List<LearnerError>();

    public virtual ICollection<PlanTask> PlanTasks { get; set; } = new List<PlanTask>();

    public virtual ICollection<UserSkillScore> UserSkillScores { get; set; } = new List<UserSkillScore>();
}
