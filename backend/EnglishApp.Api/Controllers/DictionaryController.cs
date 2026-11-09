using EnglishApp.Api.Common.Auth;
using EnglishApp.Api.DTOs.Dictionary;
using EnglishApp.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EnglishApp.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/dictionary")]
public sealed class DictionaryController : ControllerBase
{
    private readonly IDictionaryService _dictionary;
    private readonly ICurrentUser _currentUser;

    public DictionaryController(IDictionaryService dictionary, ICurrentUser currentUser)
    {
        _dictionary = dictionary;
        _currentUser = currentUser;
    }

    [HttpGet("search")]
    [ProducesResponseType(typeof(IReadOnlyList<WordSearchItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IReadOnlyList<WordSearchItemDto>>> Search(
        [FromQuery] string q, [FromQuery] int limit = 10, CancellationToken ct = default) =>
        Ok(await _dictionary.SearchAsync(_currentUser.UserId, q, limit, ct));

    [HttpGet("words/{lemma}")]
    [ProducesResponseType(typeof(WordDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WordDto>> GetWord(string lemma, CancellationToken ct) =>
        Ok(await _dictionary.GetWordAsync(_currentUser.UserId, lemma, ct));

    [HttpPost("words/{lemma}/enrich")]
    [ProducesResponseType(typeof(WordDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WordDto>> Enrich(string lemma, CancellationToken ct) =>
        Ok(await _dictionary.EnrichAsync(lemma, ct));

    [HttpPost("context-lookup")]
    [ProducesResponseType(typeof(ContextLookupResult), StatusCodes.Status200OK)]
    public async Task<ActionResult<ContextLookupResult>> ContextLookup(
        [FromBody] ContextLookupRequest request, CancellationToken ct) =>
        Ok(await _dictionary.ContextLookupAsync(_currentUser.UserId, request, ct));

    [HttpPost("translate")]
    [ProducesResponseType(typeof(TranslateResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<TranslateResponse>> Translate(
        [FromBody] TranslateRequest request, CancellationToken ct) =>
        Ok(await _dictionary.TranslateAsync(request.Text, request.From, request.To, ct));

    [HttpGet("word-of-the-day")]
    [ProducesResponseType(typeof(WordOfTheDayDto), StatusCodes.Status200OK)]
    public async Task<ActionResult<WordOfTheDayDto>> WordOfTheDay(CancellationToken ct) =>
        Ok(await _dictionary.GetWordOfTheDayAsync(_currentUser.UserId, ct));
}
