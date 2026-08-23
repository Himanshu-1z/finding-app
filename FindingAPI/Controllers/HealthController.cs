using FindingAPI.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FindingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly AppDbContext _context;

    public HealthController(AppDbContext context) => _context = context;

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> Check()
    {
        try
        {
            var canConnect = await _context.Database.CanConnectAsync();
            return Ok(new
            {
                status = canConnect ? "healthy" : "unhealthy",
                database = canConnect ? "connected" : "disconnected",
                timestamp = DateTime.UtcNow
            });
        }
        catch (Exception ex)
        {
            return Ok(new { status = "unhealthy", error = ex.Message, timestamp = DateTime.UtcNow });
        }
    }
}
