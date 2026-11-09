using EnglishApp.Api.Common.Auth;
using EnglishApp.Api.Common.Utilities;
using EnglishApp.Api.DTOs.Vocabulary;
using EnglishApp.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishApp.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/vocabulary")]
public sealed class VocabularyController : ControllerBase
{
    private readonly IVocabularyService _vocabulary;
    private readonly ICurrentUser _currentUser;

    public VocabularyController(IVocabularyService vocabulary, ICurrentUser currentUser)
    {
        _vocabulary = vocabulary;
        _currentUser = currentUser;
    }

    [HttpGet("words")]
    [ProducesResponseType(typeof(PagedResult<UserWordDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResult<UserWordDto>>> List(
        [FromQuery] int? folderId,
        [FromQuery] int? tagId,
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken ct = default) =>
        Ok(await _vocabulary.ListAsync(
            _currentUser.UserId, folderId, tagId, status, search, page, pageSize, ct));

    [HttpGet("words/due")]
    [ProducesResponseType(typeof(IReadOnlyList<UserWordDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<UserWordDto>>> Due(
        [FromQuery] int limit = 20, CancellationToken ct = default) =>
        Ok(await _vocabulary.GetDueAsync(_currentUser.UserId, limit, ct));

    [HttpGet("words/{id:int}")]
    [ProducesResponseType(typeof(UserWordDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserWordDto>> Get(int id, CancellationToken ct) =>
        Ok(await _vocabulary.GetAsync(_currentUser.UserId, id, ct));

    [HttpPost("words")]
    [ProducesResponseType(typeof(UserWordDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserWordDto>> Add(
        [FromBody] AddUserWordRequest request, CancellationToken ct) =>
        Ok(await _vocabulary.AddAsync(_currentUser.UserId, request, ct));

    [HttpPost("words/by-lemma")]
    [ProducesResponseType(typeof(UserWordDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserWordDto>> AddByLemma(
        [FromBody] AddWordByLemmaRequest request, CancellationToken ct) =>
        Ok(await _vocabulary.AddByLemmaAsync(_currentUser.UserId, request, ct));

    [HttpPut("words/{id:int}")]
    [ProducesResponseType(typeof(UserWordDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<UserWordDto>> Update(
        int id, [FromBody] UpdateUserWordRequest request, CancellationToken ct) =>
        Ok(await _vocabulary.UpdateAsync(_currentUser.UserId, id, request, ct));

    [HttpDelete("words/{id:int}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Remove(int id, CancellationToken ct)
    {
        await _vocabulary.RemoveAsync(_currentUser.UserId, id, ct);
        return NoContent();
    }

    [HttpGet("stats")]
    [ProducesResponseType(typeof(VocabularyStatsDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<VocabularyStatsDto>> Stats(CancellationToken ct) =>
        Ok(await _vocabulary.GetStatsAsync(_currentUser.UserId, ct));

    [HttpGet("folders")]
    public async Task<ActionResult<IReadOnlyList<FolderDto>>> Folders(CancellationToken ct) =>
        Ok(await _vocabulary.GetFoldersAsync(_currentUser.UserId, ct));

    [HttpPost("folders")]
    public async Task<ActionResult<FolderDto>> CreateFolder(
        [FromBody] CreateFolderRequest request, CancellationToken ct) =>
        Ok(await _vocabulary.CreateFolderAsync(_currentUser.UserId, request.Name, ct));

    [HttpPut("folders/{id:int}")]
    public async Task<ActionResult<FolderDto>> UpdateFolder(
        int id, [FromBody] UpdateFolderRequest request, CancellationToken ct) =>
        Ok(await _vocabulary.UpdateFolderAsync(_currentUser.UserId, id, request.Name, ct));

    [HttpDelete("folders/{id:int}")]
    public async Task<IActionResult> DeleteFolder(int id, CancellationToken ct)
    {
        await _vocabulary.DeleteFolderAsync(_currentUser.UserId, id, ct);
        return NoContent();
    }

    [HttpGet("tags")]
    public async Task<ActionResult<IReadOnlyList<TagDto>>> Tags(CancellationToken ct) =>
        Ok(await _vocabulary.GetTagsAsync(_currentUser.UserId, ct));

    [HttpPost("tags")]
    public async Task<ActionResult<TagDto>> CreateTag(
        [FromBody] CreateTagRequest request, CancellationToken ct) =>
        Ok(await _vocabulary.CreateTagAsync(_currentUser.UserId, request.Name, ct));

    [HttpPut("tags/{id:int}")]
    public async Task<ActionResult<TagDto>> UpdateTag(
        int id, [FromBody] UpdateTagRequest request, CancellationToken ct) =>
        Ok(await _vocabulary.UpdateTagAsync(_currentUser.UserId, id, request.Name, ct));

    [HttpDelete("tags/{id:int}")]
    public async Task<IActionResult> DeleteTag(int id, CancellationToken ct)
    {
        await _vocabulary.DeleteTagAsync(_currentUser.UserId, id, ct);
        return NoContent();
    }
}
