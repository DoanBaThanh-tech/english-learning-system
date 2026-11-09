namespace EnglishApp.Api.Services.Interfaces;

public interface IFileStorageService
{
    Task<string> SaveAsync(IFormFile file, string folder, CancellationToken ct = default);
}
