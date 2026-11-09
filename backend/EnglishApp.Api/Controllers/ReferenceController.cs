using EnglishApp.Api.DTOs.Reference;
using EnglishApp.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishApp.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/reference")]
public sealed class ReferenceController : ControllerBase
{
    private readonly IReferenceService _reference;

    public ReferenceController(IReferenceService reference) => _reference = reference;

    [HttpGet("levels")]
    [ProducesResponseType(typeof(IReadOnlyList<LevelDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<LevelDto>>> Levels(CancellationToken ct) =>
        Ok(await _reference.GetLevelsAsync(ct));

    [HttpGet("parts-of-speech")]
    [ProducesResponseType(typeof(IReadOnlyList<PartOfSpeechDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<PartOfSpeechDto>>> PartsOfSpeech(CancellationToken ct) =>
        Ok(await _reference.GetPartsOfSpeechAsync(ct));

    [HttpGet("exercise-types")]
    [ProducesResponseType(typeof(IReadOnlyList<ExerciseTypeDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<ExerciseTypeDto>>> ExerciseTypes(CancellationToken ct) =>
        Ok(await _reference.GetExerciseTypesAsync(ct));

    [HttpGet("skills")]
    [ProducesResponseType(typeof(IReadOnlyList<SkillDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<SkillDto>>> Skills(CancellationToken ct) =>
        Ok(await _reference.GetSkillsAsync(ct));

    [HttpGet("all")]
    public async Task<ActionResult<object>> All(CancellationToken ct) => Ok(new
    {
        levels = await _reference.GetLevelsAsync(ct),
        partsOfSpeech = await _reference.GetPartsOfSpeechAsync(ct),
        exerciseTypes = await _reference.GetExerciseTypesAsync(ct),
        skills = await _reference.GetSkillsAsync(ct)
    });
}
