using FindingAPI.DTOs.Auth;
using FindingAPI.Models.Entities;
using FindingAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FindingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly IJwtService _jwtService;

    public AuthController(IAuthService authService, IJwtService jwtService)
    {
        _authService = authService;
        _jwtService = jwtService;
    }

    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        try
        {
            var result = await _authService.RegisterAsync(request);
            return Ok(result);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Register Exception: {ex.Message}");
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await _authService.LoginAsync(request);
        if (result == null) return Unauthorized(new { error = "Invalid email or password." });
        return Ok(result);
    }

    [HttpGet("guest-token")]
    [AllowAnonymous]
    public IActionResult GetGuestToken()
    {
        var guestId = Guid.NewGuid();
        var guestUser = new User
        {
            Id = guestId,
            AnonymousUsername = "guest_" + guestId.ToString("N")[..6],
            Email = $"guest_{guestId.ToString("N")[..6]}@finding.app",
            PasswordHash = "guest"
        };
        var token = _jwtService.GenerateAccessToken(guestUser);
        return Ok(new
        {
            accessToken = token,
            refreshToken = _jwtService.GenerateRefreshToken(),
            expiresAt = DateTime.UtcNow.AddHours(24),
            user = new { id = guestId, mysteryName = guestUser.AnonymousUsername, email = guestUser.Email, gender = "Other" }
        });
    }

    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest request)
    {
        var result = await _authService.RefreshTokenAsync(request.AccessToken, request.RefreshToken);
        if (result == null) return BadRequest(new { error = "Invalid refresh token." });
        return Ok(result);
    }
}
