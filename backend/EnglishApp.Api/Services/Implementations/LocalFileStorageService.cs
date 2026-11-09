using EnglishApp.Api.Common.Exceptions;
using EnglishApp.Api.Services.Interfaces;

namespace EnglishApp.Api.Services.Implementations;

/// <summary>
/// Lưu file vào wwwroot/uploads (phù hợp demo/local). Có thể thay bằng Cloudinary
/// unsigned preset sau này mà không đổi controller.
/// </summary>
public sealed class LocalFileStorageService : IFileStorageService
{
    private static readonly HashSet<string> AllowedExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".webm", ".wav", ".mp3", ".m4a", ".ogg", ".mp4"
    };

    private const long MaxBytes = 15 * 1024 * 1024;
    private readonly IWebHostEnvironment _environment;

    public LocalFileStorageService(IWebHostEnvironment environment) => _environment = environment;

    public async Task<string> SaveAsync(IFormFile file, string folder, CancellationToken ct = default)
    {
        if (file.Length == 0) throw new BadRequestException("File rỗng.");
        if (file.Length > MaxBytes) throw new BadRequestException("File vượt quá 15MB.");

        var extension = Path.GetExtension(file.FileName);
        if (!AllowedExtensions.Contains(extension))
        {
            throw new BadRequestException("Chỉ hỗ trợ file âm thanh webm, wav, mp3, m4a, ogg.");
        }

        var root = string.IsNullOrWhiteSpace(_environment.WebRootPath)
            ? Path.Combine(_environment.ContentRootPath, "wwwroot")
            : _environment.WebRootPath;

        var relativeFolder = Path.Combine(folder, DateTime.UtcNow.ToString("yyyy-MM")).Replace('\\', '/');
        var absoluteFolder = Path.Combine(root, relativeFolder);
        Directory.CreateDirectory(absoluteFolder);

        var fileName = $"{Guid.NewGuid():N}{extension.ToLowerInvariant()}";
        var absolutePath = Path.Combine(absoluteFolder, fileName);

        await using var stream = File.Create(absolutePath);
        await file.CopyToAsync(stream, ct);

        return "/" + Path.Combine(relativeFolder, fileName).Replace('\\', '/');
    }
}
