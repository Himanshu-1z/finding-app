using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using FindingAPI.Models.Entities;
using Microsoft.IdentityModel.Tokens;

namespace FindingAPI.Services;

public class JwtService : IJwtService
{
    private readonly IConfiguration _configuration;

    public JwtService(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public string GenerateAccessToken(User user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"] ?? "FindingSecretJwtKey32BytesLongMinimumForHmacSha256!";
        var issuer = jwtSettings["Issuer"] ?? "Finding";
        var audience = jwtSettings["Audience"] ?? "FindingUsers";
        var expiry = string.IsNullOrEmpty(jwtSettings["ExpiryInMinutes"]) ? 1440.0 : Convert.ToDouble(jwtSettings["ExpiryInMinutes"]);

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email ?? "user@finding.app"),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
            new Claim("uid", user.Id.ToString()),
            new Claim("mystery_name", string.IsNullOrEmpty(user.AnonymousUsername) ? "Anon" : user.AnonymousUsername),
            new Claim("is_admin", user.IsAdmin.ToString()),
            new Claim(ClaimTypes.Role, user.IsAdmin ? "Admin" : "User")
        };

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiry),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public string GenerateRefreshToken()
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        return Convert.ToBase64String(randomBytes);
    }

    public ClaimsPrincipal? ValidateToken(string token)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["SecretKey"] ?? "FindingSecretJwtKey32BytesLongMinimumForHmacSha256!";
        var issuer = jwtSettings["Issuer"] ?? "Finding";
        var audience = jwtSettings["Audience"] ?? "FindingUsers";

        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(secretKey);

        try
        {
            var principal = tokenHandler.ValidateToken(token, new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = issuer,
                ValidateAudience = true,
                ValidAudience = audience,
                ValidateLifetime = false
            }, out _);

            return principal;
        }
        catch
        {
            return null;
        }
    }
}
