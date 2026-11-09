using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class UserSkillScore
{
    public long Id { get; set; }

    public int UserId { get; set; }

    public byte SkillId { get; set; }

    public decimal Score { get; set; }

    public DateTime MeasuredAt { get; set; }

    public virtual Skill Skill { get; set; } = null!;

    public virtual User User { get; set; } = null!;
}
