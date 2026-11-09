using EnglishApp.Api.Models;

namespace EnglishApp.Api.Repositories.Specific;

public interface IUserWordRepository
{
    Task<UserWord?> GetDetailAsync(int userWordId, int userId, CancellationToken ct = default);
    Task<List<UserWord>> GetDueAsync(int userId, int limit, CancellationToken ct = default);
    Task<List<UserWord>> GetNewAsync(int userId, int limit, CancellationToken ct = default);
    Task<(List<UserWord> Items, int Total)> ListAsync(
        int userId, int? folderId, int? tagId, string? status, string? search,
        int page, int pageSize, CancellationToken ct = default);
    Task<int> CountAsync(int userId, CancellationToken ct = default);
    Task<int> CountDueAsync(int userId, CancellationToken ct = default);
}
