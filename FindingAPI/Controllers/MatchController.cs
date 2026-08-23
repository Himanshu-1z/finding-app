using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FindingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MatchController : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public IActionResult GetMatches() => Ok(new { items = Array.Empty<object>() });

    [HttpDelete("{matchId:guid}")]
    [AllowAnonymous]
    public IActionResult UnMatch(Guid matchId) => Ok(new { success = true });
}
