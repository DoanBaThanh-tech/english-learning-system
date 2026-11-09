using EnglishApp.Api.Common.Utilities;
using EnglishApp.Api.Data;
using EnglishApp.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace EnglishApp.Api.Repositories.Specific;

public sealed class UserRepository : IUserRepository
{
    private readonly AppDbContext _db;

    public UserRepository(AppDbContext db) => _db = db;

    public Task<User?> GetByEmailAsync(string email, CancellationToken ct = default)
    {
        var normalized = TextUtil.Normalize(email);
        return _db.Users
            .Include(u => u.CurrentLevel)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalized, ct);
    }

    public Task<User?> GetProfileAsync(int userId, CancellationToken ct = default) =>
        _db.Users
            .Include(u => u.CurrentLevel)
            .FirstOrDefaultAsync(u => u.Id == userId, ct);

    public Task<bool> EmailExistsAsync(string email, CancellationToken ct = default)
    {
        var normalized = TextUtil.Normalize(email);
        return _db.Users.AnyAsync(u => u.Email.ToLower() == normalized, ct);
    }

    public async Task<string> GetTimeZoneAsync(int userId, CancellationToken ct = default)
    {
        var timeZone = await _db.Users
            .Where(u => u.Id == userId)
            .Select(u => u.TimeZoneId)
            .FirstOrDefaultAsync(ct);

        return timeZone ?? "SE Asia Standard Time";
    }

    public Task<Level?> GetLevelAsync(byte levelId, CancellationToken ct = default) =>
        _db.Levels.FirstOrDefaultAsync(l => l.Id == levelId, ct);
}
