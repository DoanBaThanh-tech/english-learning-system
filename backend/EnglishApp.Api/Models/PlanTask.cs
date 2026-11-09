using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class PlanTask
{
    public int Id { get; set; }

    public int PlanId { get; set; }

    public byte SkillId { get; set; }

    public string Title { get; set; } = null!;

    public DateOnly DueDate { get; set; }

    public bool IsDone { get; set; }

    public int? LessonId { get; set; }

    public int? PassageId { get; set; }

    public int? ScenarioId { get; set; }

    public virtual GeneratedLesson? Lesson { get; set; }

    public virtual ReadingPassage? Passage { get; set; }

    public virtual LearningPlan Plan { get; set; } = null!;

    public virtual ChatScenario? Scenario { get; set; }

    public virtual Skill Skill { get; set; } = null!;
}
