using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FindingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PaymentController : ControllerBase
{
    [HttpPost("initiate")]
    [AllowAnonymous]
    public IActionResult Initiate([FromBody] object request)
    {
        return Ok(new { orderId = Guid.NewGuid(), amount = 29, currency = "INR", status = "created" });
    }

    [HttpPost("verify")]
    [AllowAnonymous]
    public IActionResult Verify([FromBody] object request)
    {
        return Ok(new { success = true, message = "Payment verified" });
    }
}
