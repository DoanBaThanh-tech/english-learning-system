using EnglishApp.Api.Data;
using EnglishApp.Api.DTOs.Reference;
using EnglishApp.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace EnglishApp.Api.Services.Implementations;

public sealed class ReferenceService : IReferenceService
{
    private readonly AppDbContext _db;

    public ReferenceService(AppDbContext db) => _db = db;

    public async Task<IReadOnlyList<LevelDto>> GetLevelsAsync(CancellationToken ct = default) =>
        await _db.Levels.AsNoTracking().OrderBy(l => l.Id)
            .Select(l => new LevelDto(l.Id, l.Code, l.Name))
            .ToListAsync(ct);

    public async Task<IReadOnlyList<PartOfSpeechDto>> GetPartsOfSpeechAsync(CancellationToken ct = default) =>
        await _db.PartsOfSpeeches.AsNoTracking().OrderBy(p => p.Id)
            .Select(p => new PartOfSpeechDto(p.Id, p.Code, p.NameVi))
            .ToListAsync(ct);

    public async Task<IReadOnlyList<ExerciseTypeDto>> GetExerciseTypesAsync(CancellationToken ct = default) =>
        await _db.ExerciseTypes.AsNoTracking().OrderBy(e => e.Id)
            .Select(e => new ExerciseTypeDto(e.Id, e.Code, e.NameVi))
            .ToListAsync(ct);

    public async Task<IReadOnlyList<SkillDto>> GetSkillsAsync(CancellationToken ct = default) =>
        await _db.Skills.AsNoTracking().OrderBy(s => s.Id)
            .Select(s => new SkillDto(s.Id, s.Code, s.NameVi))
            .ToListAsync(ct);
}
