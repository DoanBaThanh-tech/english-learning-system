using EnglishApp.Api.DTOs.Lessons;

namespace EnglishApp.Api.Services.Interfaces;

public interface ISourceLessonService
{
    Task<IReadOnlyList<SourceDto>> ListSourcesAsync(int userId, CancellationToken ct = default);
    Task<SourceDto> GetSourceAsync(int userId, int id, CancellationToken ct = default);
    Task<SourceDto> CreateSourceAsync(int userId, CreateSourceRequest request, CancellationToken ct = default);
    Task<SourceDto> UpdateSourceAsync(int userId, int id, UpdateSourceRequest request, CancellationToken ct = default);
    Task DeleteSourceAsync(int userId, int id, CancellationToken ct = default);

    Task<LessonDetailDto> GenerateLessonAsync(
        int userId, int sourceId, GenerateLessonRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<LessonSummaryDto>> ListLessonsAsync(int userId, CancellationToken ct = default);
    Task<LessonDetailDto> GetLessonAsync(int userId, int id, CancellationToken ct = default);
    Task DeleteLessonAsync(int userId, int id, CancellationToken ct = default);
}
