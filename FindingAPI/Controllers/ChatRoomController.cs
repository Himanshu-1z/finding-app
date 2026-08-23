using System.Security.Claims;
using FindingAPI.DTOs.Chat;
using FindingAPI.Hubs;
using FindingAPI.Models.Entities;
using FindingAPI.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;

namespace FindingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ChatRoomController : ControllerBase
{
    private readonly IChatRepository _chatRepo;
    private readonly IUserRepository _userRepo;
    private readonly IHubContext<ChatHub> _hubContext;

    public ChatRoomController(
        IChatRepository chatRepo,
        IUserRepository userRepo,
        IHubContext<ChatHub> hubContext)
    {
        _chatRepo = chatRepo;
        _userRepo = userRepo;
        _hubContext = hubContext;
    }

    private Guid CurrentUserId
    {
        get
        {
            var idClaim = User.FindFirstValue("uid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            return Guid.TryParse(idClaim, out var id) ? id : Guid.Empty;
        }
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetMyChatRooms()
    {
        var userId = CurrentUserId;
        if (userId == Guid.Empty)
        {
            return Ok(Array.Empty<object>());
        }

        var rooms = await _chatRepo.GetUserChatRoomsAsync(userId);
        var mapped = rooms.Select(r =>
        {
            var partner = (r.User1Id == userId) ? r.User2 : r.User1;
            var partnerName = partner != null && !string.IsNullOrEmpty(partner.AnonymousUsername)
                ? partner.AnonymousUsername
                : (r.User1Id == userId ? "User 2" : "User 1");
            var lastMsg = r.Messages.OrderByDescending(m => m.SentAt).FirstOrDefault();

            return new
            {
                id = r.Id.ToString(),
                partnerId = partner?.Id,
                name = partnerName,
                partnerName = partnerName,
                letter = string.IsNullOrEmpty(partnerName) ? "A" : partnerName[..1].ToUpper(),
                status = "Online",
                lastMessage = lastMsg != null ? lastMsg.Content : "Connected! Say hello",
                time = lastMsg != null ? lastMsg.SentAt.ToString("g") : r.CreatedAt.ToString("g"),
                unread = false,
                isActive = r.IsActive,
                createdAt = r.CreatedAt,
                user1 = new { id = r.User1Id, name = r.User1?.AnonymousUsername },
                user2 = new { id = r.User2Id, name = r.User2?.AnonymousUsername }
            };
        }).ToList();

        return Ok(mapped);
    }

    [HttpGet("{chatRoomId:guid}/messages")]
    [AllowAnonymous]
    public async Task<IActionResult> GetMessages(Guid chatRoomId, [FromQuery] int page = 1)
    {
        var messages = await _chatRepo.GetMessagesAsync(chatRoomId, page, 50);
        var currentUserId = CurrentUserId;
        return Ok(messages.OrderBy(m => m.SentAt).Select(m => new
        {
            id = m.Id.ToString(),
            senderId = m.SenderId,
            sender = (currentUserId != Guid.Empty && m.SenderId == currentUserId) ? "me" : "them",
            senderName = m.Sender?.AnonymousUsername ?? "Anonymous",
            content = m.Content,
            text = m.Content,
            sentAt = m.SentAt,
            time = m.SentAt.ToString("t"),
            isRead = m.IsRead
        }));
    }

    [HttpPost("{chatRoomId:guid}/messages")]
    [AllowAnonymous]
    public async Task<IActionResult> SendMessage(Guid chatRoomId, [FromBody] SendMessageRequest request)
    {
        var senderId = CurrentUserId;
        var sender = senderId != Guid.Empty ? await _userRepo.GetByIdAsync(senderId) : null;
        var senderName = sender?.AnonymousUsername ?? "Anonymous";

        var message = new ChatMessage
        {
            ChatRoomId = chatRoomId,
            SenderId = senderId,
            Content = request.Content,
            SentAt = DateTime.UtcNow
        };
        await _chatRepo.AddMessageAsync(message);
        await _chatRepo.SaveChangesAsync();

        var payload = new
        {
            id = message.Id.ToString(),
            chatRoomId = chatRoomId.ToString(),
            senderId = message.SenderId.ToString(),
            sender = "them",
            senderName = senderName,
            content = message.Content,
            text = message.Content,
            sentAt = message.SentAt,
            time = message.SentAt.ToString("t")
        };

        // Broadcast to SignalR group in real-time
        try
        {
            await _hubContext.Clients.Group(chatRoomId.ToString()).SendAsync("ReceiveMessage", payload);
        }
        catch {}

        return Ok(new { id = message.Id.ToString(), senderId = message.SenderId.ToString(), sender = "me", senderName, content = message.Content, text = message.Content, sentAt = message.SentAt, time = message.SentAt.ToString("t") });
    }
}

