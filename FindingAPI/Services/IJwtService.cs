using System.Security.Claims;
using FindingAPI.Models.Entities;

namespace FindingAPI.Services;

public interface IJwtService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    ClaimsPrincipal? ValidateToken(string token);
}
