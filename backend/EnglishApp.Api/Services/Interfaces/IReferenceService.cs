using EnglishApp.Api.DTOs.Reference;

namespace EnglishApp.Api.Services.Interfaces;

public interface IReferenceService
{
    Task<IReadOnlyList<LevelDto>> GetLevelsAsync(CancellationToken ct = default);
    Task<IReadOnlyList<PartOfSpeechDto>> GetPartsOfSpeechAsync(CancellationToken ct = default);
    Task<IReadOnlyList<ExerciseTypeDto>> GetExerciseTypesAsync(CancellationToken ct = default);
    Task<IReadOnlyList<SkillDto>> GetSkillsAsync(CancellationToken ct = default);
}
