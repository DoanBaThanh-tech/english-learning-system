using EnglishApp.Api.Models;

namespace EnglishApp.Api.Repositories.Specific;

public interface IWordRepository
{
    Task<Word?> GetByLemmaAsync(string lemma, CancellationToken ct = default);
    Task<List<Word>> SearchAsync(string term, int limit, CancellationToken ct = default);
    Task<WordSense?> GetSenseAsync(int senseId, CancellationToken ct = default);
    Task<WordSense?> GetSenseWithWordAsync(int senseId, CancellationToken ct = default);
    Task<List<Word>> ListWithSensesAsync(int limit, CancellationToken ct = default);
}
