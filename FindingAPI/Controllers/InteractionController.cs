using System.Security.Claims;
using FindingAPI.Data;
using FindingAPI.DTOs.Interaction;
using FindingAPI.Models.Entities;
using FindingAPI.Models.Enums;
using FindingAPI.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FindingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class InteractionController : ControllerBase
{
    private readonly IInteractionRepository _interactionRepo;
    private readonly IConfessionRepository _confessionRepo;
    private readonly IChatRepository _chatRepo;
    private readonly IUserRepository _userRepo;
    private readonly AppDbContext _context;

    public InteractionController(
        IInteractionRepository interactionRepo,
        IConfessionRepository confessionRepo,
        IChatRepository chatRepo,
        IUserRepository userRepo,
        AppDbContext context)
    {
        _interactionRepo = interactionRepo;
        _confessionRepo = confessionRepo;
        _chatRepo = chatRepo;
        _userRepo = userRepo;
        _context = context;
    }

    private Guid CurrentUserId
    {
        get
        {
            var idClaim = User.FindFirstValue("uid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            return Guid.TryParse(idClaim, out var id) ? id : Guid.Empty;
        }
    }

    [HttpGet("my")]
    [AllowAnonymous]
    public async Task<IActionResult> GetMyInteractionRequests()
    {
        var userId = CurrentUserId;
        if (userId == Guid.Empty)
        {
            return Ok(new { incoming = Array.Empty<object>(), outgoing = Array.Empty<object>() });
        }

        var incoming = await _context.InteractionRequests
            .Include(i => i.TargetUser)
            .Include(i => i.Confession)
            .Include(i => i.ChatRoom)
            .Where(i => i.ConfessorId == userId)
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new
            {
                id = i.Id,
                fromUser = i.TargetUser != null ? i.TargetUser.AnonymousUsername : "Anonymous",
                requesterId = i.TargetUserId,
                avatarUrl = i.TargetUser != null ? i.TargetUser.AvatarUrl : null,
                confessionId = i.ConfessionId,
                confessionContent = i.Confession != null ? i.Confession.Content : "",
                status = i.ConfessorAction.ToString().ToLower(),
                response = i.TargetResponse.ToString(),
                createdAt = i.CreatedAt,
                chatRoomId = i.ChatRoom != null ? (Guid?)i.ChatRoom.Id : null
            })
            .ToListAsync();

        var outgoing = await _context.InteractionRequests
            .Include(i => i.Confessor)
            .Include(i => i.Confession)
            .Include(i => i.ChatRoom)
            .Where(i => i.TargetUserId == userId)
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new
            {
                id = i.Id,
                toUser = i.Confessor != null ? i.Confessor.AnonymousUsername : "Author",
                authorId = i.ConfessorId,
                avatarUrl = i.Confessor != null ? i.Confessor.AvatarUrl : null,
                confessionId = i.ConfessionId,
                confessionContent = i.Confession != null ? i.Confession.Content : "",
                status = i.ConfessorAction.ToString().ToLower(),
                response = i.TargetResponse.ToString(),
                createdAt = i.CreatedAt,
                chatRoomId = i.ChatRoom != null ? (Guid?)i.ChatRoom.Id : null
            })
            .ToListAsync();

        return Ok(new { incoming, outgoing });
    }

    [HttpPost("respond")]
    [AllowAnonymous]
    public async Task<IActionResult> Respond([FromBody] RespondToConfessionRequest request)
    {
        var confession = await _confessionRepo.GetByIdAsync(request.ConfessionId);
        if (confession == null) return NotFound();

        var userId = CurrentUserId;
        if (userId != Guid.Empty && confession.AuthorId == userId)
        {
            return BadRequest(new { error = "You cannot send an interaction request to your own story." });
        }

        var user = userId != Guid.Empty ? await _userRepo.GetByIdAsync(userId) : null;
        if (user == null)
        {
            userId = userId != Guid.Empty ? userId : Guid.NewGuid();
            user = new User
            {
                Id = userId,
                AnonymousUsername = User.FindFirstValue("mystery_name") ?? ("User_" + Guid.NewGuid().ToString("N")[..6]),
                Email = User.FindFirstValue(ClaimTypes.Email) ?? $"user_{userId:N}@finding.app",
                PasswordHash = "auto_hash",
                RealName = "",
                StudentIdNumber = "",
                StudentIdPhotoUrl = "",
                CollegeName = "",
                Branch = "",
                Department = "",
                YearSemester = "",
                MobileNumber = "",
                Section = "",
                IsActive = true,
                IsSetupComplete = false
            };
            try
            {
                await _userRepo.AddAsync(user);
                await _userRepo.SaveChangesAsync();
            }
            catch
            {
                user = await _userRepo.GetByIdAsync(userId);
            }
        }

        // Ensure author user also exists in Users table
        var author = await _userRepo.GetByIdAsync(confession.AuthorId);
        if (author == null)
        {
            author = new User
            {
                Id = confession.AuthorId,
                AnonymousUsername = "Storyteller_" + confession.AuthorId.ToString("N")[..6],
                Email = $"author_{confession.AuthorId:N}@finding.app",
                PasswordHash = "auto_hash",
                RealName = "",
                StudentIdNumber = "",
                StudentIdPhotoUrl = "",
                CollegeName = "",
                Branch = "",
                Department = "",
                YearSemester = "",
                MobileNumber = "",
                Section = "",
                IsActive = true,
                IsSetupComplete = false
            };
            try
            {
                await _userRepo.AddAsync(author);
                await _userRepo.SaveChangesAsync();
            }
            catch {}
        }

        var interaction = new InteractionRequest
        {
            ConfessionId = request.ConfessionId,
            TargetUserId = user?.Id ?? userId,
            ConfessorId = confession.AuthorId,
            TargetResponse = (InteractionResponse)request.Response,
            RespondedAt = DateTime.UtcNow
        };

        await _interactionRepo.AddAsync(interaction);

        // In-app notification for the author
        var notification = new Notification
        {
            UserId = confession.AuthorId,
            Type = NotificationType.InteractRequest,
            Title = "New Connection Request",
            Body = $"{(user?.AnonymousUsername ?? "Someone")} wants to interact with your story."
        };
        await _context.Notifications.AddAsync(notification);

        await _context.SaveChangesAsync();

        return Ok(new { success = true, interactionId = interaction.Id });
    }

    [HttpPost("confessor-action")]
    [AllowAnonymous]
    public async Task<IActionResult> ConfessorAction([FromBody] ConfessorActionRequest request)
    {
        var interaction = await _interactionRepo.GetByIdAsync(request.InteractionRequestId);
        if (interaction == null) return NotFound();

        interaction.ConfessorAction = (ConfessorResponse)request.Action;
        interaction.RespondedAt = DateTime.UtcNow;
        _interactionRepo.Update(interaction);

        if (interaction.ConfessorAction == ConfessorResponse.Accepted)
        {
            var existingChat = await _context.ChatRooms.FirstOrDefaultAsync(c => c.InteractionRequestId == interaction.Id);
            if (existingChat == null)
            {
                var chatRoom = new ChatRoom
                {
                    InteractionRequestId = interaction.Id,
                    User1Id = interaction.ConfessorId,
                    User2Id = interaction.TargetUserId,
                    IsActive = true
                };
                await _context.ChatRooms.AddAsync(chatRoom);
            }

            var notification = new Notification
            {
                UserId = interaction.TargetUserId,
                Type = NotificationType.RequestAccepted,
                Title = "Connection Accepted!",
                Body = "Your interaction request was accepted. You can now chat!"
            };
            await _context.Notifications.AddAsync(notification);
        }

        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }
}

