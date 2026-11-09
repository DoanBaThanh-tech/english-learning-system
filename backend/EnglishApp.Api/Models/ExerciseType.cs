using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class ExerciseType
{
    public byte Id { get; set; }

    public string Code { get; set; } = null!;

    public string NameVi { get; set; } = null!;

    public virtual ICollection<StudyAnswer> StudyAnswers { get; set; } = new List<StudyAnswer>();
}
