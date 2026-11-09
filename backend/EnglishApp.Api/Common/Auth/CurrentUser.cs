using System.Security.Claims;
using EnglishApp.Api.Common.Exceptions;

namespace EnglishApp.Api.Common.Auth;

public interface ICurrentUser
{
    int UserId { get; }
    bool IsAuthenticated { get; }
}

public sealed class CurrentUser : ICurrentUser
{
    private readonly IHttpContextAccessor _accessor;

    public CurrentUser(IHttpContextAccessor accessor)
    {
        _accessor = accessor;
    }

    public bool IsAuthenticated => _accessor.HttpContext?.User.Identity?.IsAuthenticated == true;

    public int UserId
    {
        get
        {
            var raw = _accessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier)
                      ?? _accessor.HttpContext?.User.FindFirstValue("sub");

            if (int.TryParse(raw, out var id) && id > 0)
            {
                return id;
            }

            throw new UnauthorizedException();
        }
    }
}
