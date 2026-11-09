using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class UserWord
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public int SenseId { get; set; }

    public int? FolderId { get; set; }

    public int? SourceId { get; set; }

    public string? ContextSentence { get; set; }

    public string? Note { get; set; }

    public string Status { get; set; } = null!;

    public DateTime AddedAt { get; set; }

    public virtual WordFolder? Folder { get; set; }

    public virtual ICollection<ReviewLog> ReviewLogs { get; set; } = new List<ReviewLog>();

    public virtual WordSense Sense { get; set; } = null!;

    public virtual Source? Source { get; set; }

    public virtual SrsState? SrsState { get; set; }

    public virtual ICollection<StudyAnswer> StudyAnswers { get; set; } = new List<StudyAnswer>();

    public virtual User User { get; set; } = null!;

    public virtual ICollection<Tag> Tags { get; set; } = new List<Tag>();
}
