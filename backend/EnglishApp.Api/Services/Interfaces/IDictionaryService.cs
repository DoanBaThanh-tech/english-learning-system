using EnglishApp.Api.DTOs.Dictionary;
using EnglishApp.Api.DTOs.Reference;
using EnglishApp.Api.DTOs.Users;

namespace EnglishApp.Api.Services.Interfaces;

public interface IDictionaryService
{
    Task<IReadOnlyList<WordSearchItemDto>> SearchAsync(int userId, string query, int limit, CancellationToken ct = default);
    Task<WordDto> GetWordAsync(int userId, string lemma, CancellationToken ct = default);
    Task<WordDto> EnrichAsync(string lemma, CancellationToken ct = default);
    Task<ContextLookupResult> ContextLookupAsync(int userId, ContextLookupRequest request, CancellationToken ct = default);
    Task<TranslateResponse> TranslateAsync(string text, string? from, string? to, CancellationToken ct = default);
    Task<WordOfTheDayDto> GetWordOfTheDayAsync(int userId, CancellationToken ct = default);
}
