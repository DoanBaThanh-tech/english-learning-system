using System;
using System.Collections.Generic;

namespace EnglishApp.Api.Models;

public partial class RefreshToken
{
    public long Id { get; set; }

    public int UserId { get; set; }

    public byte[] TokenHash { get; set; } = null!;

    public DateTime ExpiresAt { get; set; }

    public DateTime? RevokedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
