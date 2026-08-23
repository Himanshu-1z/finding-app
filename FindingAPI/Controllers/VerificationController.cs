using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FindingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VerificationController : ControllerBase
{
    [HttpPost("submit")]
    [AllowAnonymous]
    public IActionResult Submit([FromBody] object request)
    {
        return Ok(new { success = true, verificationId = Guid.NewGuid(), status = "pending" });
    }

    [HttpGet("status")]
    [AllowAnonymous]
    public IActionResult GetStatus()
    {
        return Ok(new { status = "pending", message = "Verification under review" });
    }
}
