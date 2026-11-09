using EnglishApp.Api.Models;

namespace EnglishApp.Api.Repositories.Specific;

public interface IUserRepository
{
    Task<User?> GetByEmailAsync(string email, CancellationToken ct = default);
    Task<User?> GetProfileAsync(int userId, CancellationToken ct = default);
    Task<bool> EmailExistsAsync(string email, CancellationToken ct = default);
    Task<string> GetTimeZoneAsync(int userId, CancellationToken ct = default);
    Task<Level?> GetLevelAsync(byte levelId, CancellationToken ct = default);
}
