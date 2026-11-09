using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using EnglishApp.Api.Models;
using Microsoft.IdentityModel.Tokens;

namespace EnglishApp.Api.Common.Auth;

public sealed record AccessTokenResult(string Token, DateTime ExpiresAtUtc);

public interface IJwtTokenService
{
    AccessTokenResult CreateAccessToken(User user);
}

public sealed class JwtTokenService : IJwtTokenService
{
    private readonly JwtOptions _options;
    private readonly SymmetricSecurityKey _key;

    public JwtTokenService(JwtOptions options)
    {
        _options = options;
        _key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(options.Key));
    }

    public AccessTokenResult CreateAccessToken(User user)
    {
        var now = DateTime.UtcNow;
        var expires = now.AddMinutes(Math.Max(5, _options.AccessTokenMinutes));

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Email, user.Email),
            new(ClaimTypes.Name, user.DisplayName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString("N"))
        };

        if (user.CurrentLevelId is not null)
        {
            claims.Add(new Claim("levelId", user.CurrentLevelId.Value.ToString()));
        }

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            notBefore: now,
            expires: expires,
            signingCredentials: new SigningCredentials(_key, SecurityAlgorithms.HmacSha256));

        return new AccessTokenResult(new JwtSecurityTokenHandler().WriteToken(token), expires);
    }
}
