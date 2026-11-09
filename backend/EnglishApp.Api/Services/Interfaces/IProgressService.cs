namespace EnglishApp.Api.Services.Interfaces;

public interface IProgressService
{
    Task TouchAsync(
        int userId,
        int learned = 0,
        int reviewed = 0,
        int minutes = 0,
        CancellationToken ct = default);
}
