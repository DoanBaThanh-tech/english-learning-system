using EnglishApp.Api.DTOs.Errors;

namespace EnglishApp.Api.Services.Interfaces;

public interface IErrorService
{
    Task<IReadOnlyList<LearnerErrorDto>> ListAsync(
        int userId, bool? resolved, byte? skillId, int limit, CancellationToken ct = default);
    Task<LearnerErrorDto> ResolveAsync(int userId, long id, bool resolved, CancellationToken ct = default);
    Task RemoveAsync(int userId, long id, CancellationToken ct = default);
    Task<ErrorSummaryDto> SummaryAsync(int userId, CancellationToken ct = default);
}
