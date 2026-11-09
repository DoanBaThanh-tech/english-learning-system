using EnglishApp.Api.DTOs.Reading;

namespace EnglishApp.Api.Services.Interfaces;

public interface IReadingService
{
    Task<IReadOnlyList<PassageSummaryDto>> ListAsync(
        int userId, byte? levelId, string? topic, CancellationToken ct = default);
    Task<PassageDetailDto> GetAsync(int userId, int id, CancellationToken ct = default);
    Task<PassageDetailDto> CreateAsync(int userId, CreatePassageRequest request, CancellationToken ct = default);
    Task<PassageDetailDto> UpdateAsync(int userId, int id, UpdatePassageRequest request, CancellationToken ct = default);
    Task DeleteAsync(int userId, int id, CancellationToken ct = default);
    Task UpdateProgressAsync(int userId, int id, byte progressPct, CancellationToken ct = default);
    Task<PassageLensDto> GetLensAsync(int userId, int id, CancellationToken ct = default);
}
