using EnglishApp.Api.Common.Utilities;
using EnglishApp.Api.DTOs.Vocabulary;

namespace EnglishApp.Api.Services.Interfaces;

public interface IVocabularyService
{
    Task<PagedResult<UserWordDto>> ListAsync(
        int userId, int? folderId, int? tagId, string? status, string? search,
        int page, int pageSize, CancellationToken ct = default);
    Task<UserWordDto> GetAsync(int userId, int userWordId, CancellationToken ct = default);
    Task<VocabularyStatsDto> GetStatsAsync(int userId, CancellationToken ct = default);
    Task<IReadOnlyList<UserWordDto>> GetDueAsync(int userId, int limit, CancellationToken ct = default);
    Task<UserWordDto> AddAsync(int userId, AddUserWordRequest request, CancellationToken ct = default);
    Task<UserWordDto> AddByLemmaAsync(int userId, AddWordByLemmaRequest request, CancellationToken ct = default);
    Task<UserWordDto> UpdateAsync(int userId, int userWordId, UpdateUserWordRequest request, CancellationToken ct = default);
    Task RemoveAsync(int userId, int userWordId, CancellationToken ct = default);

    Task<IReadOnlyList<FolderDto>> GetFoldersAsync(int userId, CancellationToken ct = default);
    Task<FolderDto> CreateFolderAsync(int userId, string name, CancellationToken ct = default);
    Task<FolderDto> UpdateFolderAsync(int userId, int folderId, string name, CancellationToken ct = default);
    Task DeleteFolderAsync(int userId, int folderId, CancellationToken ct = default);

    Task<IReadOnlyList<TagDto>> GetTagsAsync(int userId, CancellationToken ct = default);
    Task<TagDto> CreateTagAsync(int userId, string name, CancellationToken ct = default);
    Task<TagDto> UpdateTagAsync(int userId, int tagId, string name, CancellationToken ct = default);
    Task DeleteTagAsync(int userId, int tagId, CancellationToken ct = default);
}
