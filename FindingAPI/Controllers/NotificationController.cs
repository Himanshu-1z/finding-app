using System.Security.Claims;
using FindingAPI.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FindingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class NotificationController : ControllerBase
{
    private readonly INotificationRepository _notificationRepo;

    public NotificationController(INotificationRepository notificationRepo) => _notificationRepo = notificationRepo;

    private Guid CurrentUserId
    {
        get
        {
            var idClaim = User.FindFirstValue("uid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            return Guid.TryParse(idClaim, out var id) ? id : Guid.NewGuid();
        }
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetNotifications([FromQuery] int page = 1)
    {
        var notifications = await _notificationRepo.GetUserNotificationsAsync(CurrentUserId, page, 20);
        return Ok(notifications.Select(n => new
        {
            id = n.Id, type = n.Type.ToString(), title = n.Title,
            body = n.Body, isRead = n.IsRead, createdAt = n.CreatedAt
        }));
    }

    [HttpPost("mark-read")]
    [AllowAnonymous]
    public async Task<IActionResult> MarkAllRead()
    {
        await _notificationRepo.MarkAllAsReadAsync(CurrentUserId);
        await _notificationRepo.SaveChangesAsync();
        return Ok(new { success = true });
    }
}
