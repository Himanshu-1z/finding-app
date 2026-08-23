using System.Security.Claims;
using FindingAPI.Data;
using FindingAPI.Models.Entities;
using FindingAPI.Models.Enums;
using FindingAPI.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FindingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IUserRepository _userRepo;

    public AdminController(AppDbContext context, IUserRepository userRepo)
    {
        _context = context;
        _userRepo = userRepo;
    }

    private Guid CurrentUserId
    {
        get
        {
            var idClaim = User.FindFirstValue("uid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            return Guid.TryParse(idClaim, out var id) ? id : Guid.Empty;
        }
    }

    private bool IsAdmin => User.IsInRole("Admin") || User.FindFirstValue("is_admin") == "True";
    private bool IsSuperAdmin => User.FindFirstValue("is_super_admin") == "True";

    // ─────────────────────────────────────────────
    // STATS / DASHBOARD
    // ─────────────────────────────────────────────

    [HttpGet("stats/overview")]
    [AllowAnonymous]
    public async Task<IActionResult> GetStats()
    {
        var totalUsers = await _context.Users.CountAsync();
        var totalConfessions = await _context.Confessions.CountAsync(c => !c.IsDeleted);
        var openReports = await _context.Reports.CountAsync(r => r.Status == ReportStatus.Pending);
        var pendingVerifications = await _context.StudentVerifications.CountAsync(v => v.Status == VerificationStatus.Pending);
        var today = DateTime.UtcNow.Date;
        var confessionsToday = await _context.Confessions.CountAsync(c => c.CreatedAt >= today && !c.IsDeleted);
        var bannedUsers = await _context.Users.CountAsync(u => !u.IsActive);

        return Ok(new
        {
            totalUsers,
            totalConfessions,
            openReports,
            pendingVerifications,
            confessionsToday,
            bannedUsers,
            systemHealth = "Nominal (100%)",
            activeAdmins = await _context.Users.CountAsync(u => u.IsAdmin && u.IsActive),
            maintenanceMode = false
        });
    }

    // Legacy dashboard endpoint for backward compat
    [HttpGet("dashboard")]
    [AllowAnonymous]
    public async Task<IActionResult> Dashboard()
    {
        var totalUsers = await _context.Users.CountAsync();
        var totalConfessions = await _context.Confessions.CountAsync();
        var totalReports = await _context.Reports.CountAsync();
        var pendingVerifications = await _context.StudentVerifications.CountAsync(v => v.Status == VerificationStatus.Pending);
        return Ok(new { totalUsers, totalConfessions, totalReports, pendingVerifications });
    }

    [HttpGet("activity-log")]
    [AllowAnonymous]
    public async Task<IActionResult> GetActivityLog([FromQuery] int limit = 20)
    {
        // 1. Recent Confessions
        var confessions = await _context.Confessions
            .Include(c => c.Author)
            .OrderByDescending(c => c.CreatedAt)
            .Take(8)
            .Select(c => new
            {
                id = c.Id.ToString(),
                type = "confession",
                title = "New Confession Posted",
                actor = c.Author != null ? c.Author.AnonymousUsername : "Anonymous",
                college = !string.IsNullOrEmpty(c.AuthorCollege) ? c.AuthorCollege : (c.Author != null ? c.Author.CollegeName : "Campus"),
                description = c.Content.Length > 90 ? c.Content.Substring(0, 90) + "..." : c.Content,
                timestamp = c.CreatedAt,
                status = c.IsApproved ? "Approved" : "Pending"
            })
            .ToListAsync();

        // 2. Recent Interaction Requests
        var interactions = await _context.InteractionRequests
            .Include(i => i.Confessor)
            .Include(i => i.TargetUser)
            .OrderByDescending(i => i.CreatedAt)
            .Take(8)
            .Select(i => new
            {
                id = i.Id.ToString(),
                type = "interaction",
                title = "Interaction Request",
                actor = i.TargetUser != null ? i.TargetUser.AnonymousUsername : "Student",
                college = i.TargetUser != null ? i.TargetUser.CollegeName : "Campus",
                description = $"Sent connect request to {(i.Confessor != null ? i.Confessor.AnonymousUsername : "Confessor")}",
                timestamp = i.CreatedAt,
                status = i.ConfessorAction.ToString()
            })
            .ToListAsync();

        // 3. Recent Users
        var users = await _context.Users
            .OrderByDescending(u => u.CreatedAt)
            .Take(8)
            .Select(u => new
            {
                id = u.Id.ToString(),
                type = "user",
                title = "Student Registered",
                actor = u.AnonymousUsername,
                college = u.CollegeName,
                description = $"Joined campus community ({u.Email})",
                timestamp = u.CreatedAt,
                status = u.IsActive ? "Active" : "Suspended"
            })
            .ToListAsync();

        // 4. Recent Reports
        var reports = await _context.Reports
            .Include(r => r.ReportedByUser)
            .OrderByDescending(r => r.CreatedAt)
            .Take(8)
            .Select(r => new
            {
                id = r.Id.ToString(),
                type = "report",
                title = "Abuse Report Filed",
                actor = r.ReportedByUser != null ? r.ReportedByUser.AnonymousUsername : "Reporter",
                college = "",
                description = $"Flagged content: {r.Reason}",
                timestamp = r.CreatedAt,
                status = r.Status.ToString()
            })
            .ToListAsync();

        var combined = confessions.Cast<object>()
            .Concat(interactions)
            .Concat(users)
            .Concat(reports)
            .OrderByDescending(a => ((dynamic)a).timestamp)
            .Take(limit)
            .ToList();

        return Ok(combined);
    }


    // ─────────────────────────────────────────────
    // USERS
    // ─────────────────────────────────────────────

    [HttpGet("users")]
    [AllowAnonymous]
    public async Task<IActionResult> GetUsers(
        [FromQuery] string? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = _context.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = status switch
            {
                "active" => query.Where(u => u.IsActive),
                "suspended" => query.Where(u => !u.IsActive),
                "admin" => query.Where(u => u.IsAdmin),
                _ => query
            };
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.ToLower();
            query = query.Where(u =>
                u.AnonymousUsername.ToLower().Contains(s) ||
                u.Email.ToLower().Contains(s) ||
                (u.RealName != null && u.RealName.ToLower().Contains(s)));
        }

        var total = await query.CountAsync();
        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new
        {
            users = users.Select(u => new
            {
                id = u.Id,
                secretName = u.AnonymousUsername,
                mysteryName = u.AnonymousUsername,
                name = u.RealName ?? "",
                email = u.Email,
                college = u.CollegeName,
                branch = u.Branch,
                semester = u.YearSemester ?? "",
                mobile = u.MobileNumber ?? "",
                dob = u.DateOfBirth.ToString("yyyy-MM-dd"),
                status = u.IsActive ? "active" : "suspended",
                isActive = u.IsActive,
                isAdmin = u.IsAdmin,
                isSuperAdmin = u.Email.EndsWith("@finding.app") && u.IsAdmin,
                isSetupComplete = u.IsSetupComplete,
                isVerifiedBadge = u.VerificationStatus == VerificationStatus.Approved,
                capturedIdImage = !string.IsNullOrEmpty(u.CapturedIdImage) ? u.CapturedIdImage : (!string.IsNullOrEmpty(u.StudentIdPhotoUrl) ? u.StudentIdPhotoUrl : u.AvatarUrl),
                studentIdPhotoUrl = !string.IsNullOrEmpty(u.StudentIdPhotoUrl) ? u.StudentIdPhotoUrl : u.CapturedIdImage,
                gender = u.Gender.ToString(),
                createdAt = u.CreatedAt,
                lastActiveAt = u.UpdatedAt
            }),
            total
        });
    }

    [HttpPatch("users/{userId:guid}/status")]
    [AllowAnonymous]
    public async Task<IActionResult> UpdateUserStatus(Guid userId, [FromBody] UpdateStatusRequest req)
    {
        var user = await _userRepo.GetByIdAsync(userId);
        if (user == null) return NotFound();

        user.IsActive = req.Status == "active";
        user.UpdatedAt = DateTime.UtcNow;
        _userRepo.Update(user);
        await _userRepo.SaveChangesAsync();
        return Ok(new { success = true, status = req.Status });
    }

    [HttpPost("users/{userId:guid}/toggle-active")]
    [AllowAnonymous]
    public async Task<IActionResult> ToggleUserActive(Guid userId)
    {
        var user = await _userRepo.GetByIdAsync(userId);
        if (user == null) return NotFound();
        user.IsActive = !user.IsActive;
        user.UpdatedAt = DateTime.UtcNow;
        _userRepo.Update(user);
        await _userRepo.SaveChangesAsync();
        return Ok(new { success = true, isActive = user.IsActive, status = user.IsActive ? "active" : "suspended" });
    }

    [HttpDelete("users/{userId:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> DeleteUser(Guid userId)
    {
        var user = await _userRepo.GetByIdAsync(userId);
        if (user == null) return NotFound();

        // Soft-delete: deactivate + anonymise
        user.IsActive = false;
        user.Email = $"deleted_{userId:N}@removed.finding.app";
        user.AnonymousUsername = "DeletedUser";
        user.RealName = string.Empty;
        user.MobileNumber = string.Empty;
        user.UpdatedAt = DateTime.UtcNow;
        _userRepo.Update(user);
        await _userRepo.SaveChangesAsync();
        return Ok(new { success = true });
    }

    [HttpPost("users/{userId:guid}/promote")]
    [AllowAnonymous]
    public async Task<IActionResult> PromoteToAdmin(Guid userId, [FromBody] PromoteRequest req)
    {
        var user = await _userRepo.GetByIdAsync(userId);
        if (user == null) return NotFound();
        user.IsAdmin = req.IsAdmin;
        user.UpdatedAt = DateTime.UtcNow;
        _userRepo.Update(user);
        await _userRepo.SaveChangesAsync();
        return Ok(new { success = true, isAdmin = user.IsAdmin });
    }

    // ─────────────────────────────────────────────
    // CONFESSIONS
    // ─────────────────────────────────────────────

    [HttpGet("confessions")]
    [AllowAnonymous]
    public async Task<IActionResult> GetConfessions(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        var query = _context.Confessions.Include(c => c.Author).AsQueryable();

        if (!string.IsNullOrWhiteSpace(status))
        {
            query = status switch
            {
                "visible" => query.Where(c => !c.IsDeleted && c.IsApproved),
                "hidden" => query.Where(c => !c.IsApproved && !c.IsDeleted),
                "removed" => query.Where(c => c.IsDeleted),
                _ => query
            };
        }

        var total = await query.CountAsync();
        var confessions = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new
        {
            confessions = confessions.Select(c => new
            {
                id = c.Id,
                author = c.Author != null ? c.Author.AnonymousUsername : "Unknown",
                authorId = c.AuthorId,
                content = c.Content,
                type = c.Type.ToString(),
                status = c.IsDeleted ? "removed" : (c.IsApproved ? "visible" : "hidden"),
                isApproved = c.IsApproved,
                isDeleted = c.IsDeleted,
                reportCount = 0,
                likes = c.LikesCount,
                likedByMe = false,
                isRequested = false,
                isPinned = false,
                time = c.CreatedAt.ToString("o"),
                createdAt = c.CreatedAt
            }),
            total
        });
    }

    [HttpPatch("confessions/{confessionId:guid}/moderate")]
    [AllowAnonymous]
    public async Task<IActionResult> ModerateConfession(Guid confessionId, [FromBody] ModerateRequest req)
    {
        var confession = await _context.Confessions.FindAsync(confessionId);
        if (confession == null) return NotFound();

        confession.IsApproved = req.Status == "visible";
        confession.IsDeleted = req.Status == "removed";
        await _context.SaveChangesAsync();
        return Ok(new { success = true, status = req.Status });
    }

    [HttpDelete("confessions/{confessionId:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> DeleteConfession(Guid confessionId)
    {
        var confession = await _context.Confessions.FindAsync(confessionId);
        if (confession == null) return NotFound();
        confession.IsDeleted = true;
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    [HttpPost("confessions/purge")]
    [AllowAnonymous]
    public async Task<IActionResult> PurgeDeletedConfessions()
    {
        var deleted = await _context.Confessions.Where(c => c.IsDeleted).ToListAsync();
        _context.Confessions.RemoveRange(deleted);
        await _context.SaveChangesAsync();
        return Ok(new { purgedCount = deleted.Count });
    }

    // ─────────────────────────────────────────────
    // REPORTS
    // ─────────────────────────────────────────────

    [HttpGet("reports")]
    [AllowAnonymous]
    public async Task<IActionResult> GetReports([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var reports = await _context.Reports
            .Include(r => r.ReportedByUser)
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var total = await _context.Reports.CountAsync();

        return Ok(new
        {
            requests = reports.Select(r => new
            {
                id = r.Id,
                fromUser = r.ReportedByUser != null ? r.ReportedByUser.AnonymousUsername : "Unknown",
                avatarUrl = (string?)null,
                reason = r.Reason.ToString() + (string.IsNullOrEmpty(r.Details) ? "" : $": {r.Details}"),
                status = r.Status.ToString().ToLower(),
                timestamp = r.CreatedAt.ToString("o"),
                reportedUserId = r.ReportedUserId
            }),
            total
        });
    }

    [HttpPatch("reports/{reportId:guid}/resolve")]
    [AllowAnonymous]
    public async Task<IActionResult> ResolveReport(Guid reportId, [FromBody] ResolveReportRequest req)
    {
        var report = await _context.Reports.FindAsync(reportId);
        if (report == null) return NotFound();

        report.Status = req.Status == "accepted" ? ReportStatus.Resolved : ReportStatus.Dismissed;
        report.ReviewedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // ─────────────────────────────────────────────
    // INTERACTION REQUESTS
    // ─────────────────────────────────────────────

    [HttpGet("interaction-requests")]
    [AllowAnonymous]
    public async Task<IActionResult> GetInteractionRequests([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var requests = await _context.InteractionRequests
            .Include(r => r.Confessor)
            .Include(r => r.TargetUser)
            .Include(r => r.Confession)
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        var total = await _context.InteractionRequests.CountAsync();

        return Ok(new
        {
            requests = requests.Select(r => new
            {
                id = r.Id,
                requesterId = r.TargetUserId,
                requesterName = r.TargetUser != null ? r.TargetUser.AnonymousUsername : "Unknown User",
                requesterEmail = r.TargetUser != null ? r.TargetUser.Email : "",
                targetId = r.ConfessorId,
                targetName = r.Confessor != null ? r.Confessor.AnonymousUsername : "Confession Author",
                confessionId = r.ConfessionId,
                confessionContent = r.Confession != null ? r.Confession.Content : "",
                confessionPreview = r.Confession != null && r.Confession.Content != null && r.Confession.Content.Length > 120 ? r.Confession.Content[..120] + "..." : (r.Confession?.Content ?? ""),
                status = r.ConfessorAction.ToString(),
                response = r.TargetResponse.ToString(),
                createdAt = r.CreatedAt
            }),
            total
        });
    }

    [HttpGet("chats")]
    public async Task<IActionResult> GetChats()
    {
        try
        {
            var chatRooms = await _context.ChatRooms
                .Include(c => c.User1)
                .Include(c => c.User2)
                .Include(c => c.Messages)
                .ToListAsync();

            var chatsList = chatRooms.Select(c =>
            {
                var u1Name = c.User1 != null && !string.IsNullOrEmpty(c.User1.RealName) ? c.User1.RealName : (c.User1?.AnonymousUsername ?? "User 1");
                var u2Name = c.User2 != null && !string.IsNullOrEmpty(c.User2.RealName) ? c.User2.RealName : (c.User2?.AnonymousUsername ?? "User 2");
                var lastMsgObj = c.Messages != null ? c.Messages.OrderByDescending(m => m.SentAt).FirstOrDefault() : null;

                return new
                {
                    id = c.Id.ToString(),
                    name = $"{u1Name} & {u2Name}",
                    letter = string.IsNullOrEmpty(u1Name) ? "A" : u1Name.Substring(0, 1),
                    status = c.IsActive ? "active" : "archived",
                    lastMessage = lastMsgObj != null ? lastMsgObj.Content : "No messages yet",
                    time = c.CreatedAt.ToString("o"),
                    unread = 0,
                    messages = (c.Messages ?? Enumerable.Empty<ChatMessage>()).OrderBy(m => m.SentAt).Select(m => new
                    {
                        id = m.Id.ToString(),
                        sender = m.SenderId == c.User1Id ? "me" : "them",
                        text = m.Content,
                        time = m.SentAt.ToString("g")
                    }).ToList()
                };
            }).ToList();

            return Ok(new { threads = chatsList, total = chatsList.Count });
        }
        catch
        {
            return Ok(new { threads = Array.Empty<object>(), total = 0 });
        }
    }

    [HttpPost("interaction-requests/{id:guid}/approve")]
    [AllowAnonymous]
    public async Task<IActionResult> ApproveInteractionRequest(Guid id)
    {
        var request = await _context.InteractionRequests.FindAsync(id);
        if (request == null) return NotFound();

        request.ConfessorAction = ConfessorResponse.Accepted;
        request.RespondedAt = DateTime.UtcNow;

        var existingChat = await _context.ChatRooms.FirstOrDefaultAsync(c => c.InteractionRequestId == id);
        if (existingChat == null)
        {
            var chatRoom = new ChatRoom
            {
                InteractionRequestId = request.Id,
                User1Id = request.ConfessorId,
                User2Id = request.TargetUserId
            };
            await _context.ChatRooms.AddAsync(chatRoom);
        }

        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = "Interaction approved & connected" });
    }

    [HttpPost("interaction-requests/{id:guid}/decline")]
    [AllowAnonymous]
    public async Task<IActionResult> DeclineInteractionRequest(Guid id)
    {
        var request = await _context.InteractionRequests.FindAsync(id);
        if (request == null) return NotFound();

        request.ConfessorAction = ConfessorResponse.Declined;
        request.RespondedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return Ok(new { success = true, message = "Interaction declined" });
    }

    [HttpDelete("interaction-requests/{id:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> DeleteInteractionRequest(Guid id)
    {
        var request = await _context.InteractionRequests.FindAsync(id);
        if (request == null) return NotFound();

        _context.InteractionRequests.Remove(request);
        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }


    // ─────────────────────────────────────────────
    // VERIFICATIONS
    // ─────────────────────────────────────────────

    [HttpGet("verifications/pending")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPendingVerifications([FromQuery] string? status)
    {
        var query = _context.StudentVerifications.Include(v => v.User).AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && status.ToLower() != "all")
        {
            if (Enum.TryParse<VerificationStatus>(status, true, out var verStatus))
            {
                query = query.Where(v => v.Status == verStatus);
            }
        }
        else if (string.IsNullOrWhiteSpace(status))
        {
            query = query.Where(v => v.Status == VerificationStatus.Pending);
        }

        var verifications = await query
            .OrderByDescending(v => v.SubmittedAt)
            .ToListAsync();

        return Ok(verifications.Select(v => new
        {
            id = v.Id,
            userId = v.UserId,
            userRealName = v.User != null ? (!string.IsNullOrEmpty(v.User.RealName) ? v.User.RealName : v.User.AnonymousUsername) : "Unknown",
            userEmail = v.User != null ? v.User.Email : "",
            college = v.User != null ? v.User.CollegeName : "",
            studentIdPhotoUrl = !string.IsNullOrEmpty(v.StudentIdPhotoUrl) ? v.StudentIdPhotoUrl : (v.User != null ? (!string.IsNullOrEmpty(v.User.CapturedIdImage) ? v.User.CapturedIdImage : v.User.AvatarUrl) : ""),
            status = v.Status.ToString(),
            adminNotes = v.AdminNotes ?? "",
            submittedAt = v.SubmittedAt.ToString("o"),
            ocrConfidence = 0.9
        }));
    }

    [HttpPost("verifications/review")]
    [AllowAnonymous]
    public async Task<IActionResult> ReviewVerification([FromBody] ReviewVerificationRequest req)
    {
        if (!Guid.TryParse(req.VerificationId, out var verificationId))
            return BadRequest("Invalid ID");

        var verification = await _context.StudentVerifications
            .Include(v => v.User)
            .FirstOrDefaultAsync(v => v.Id == verificationId);

        if (verification == null) return NotFound();

        verification.Status = req.Status == "Approved" ? VerificationStatus.Approved : VerificationStatus.Rejected;
        verification.ReviewedAt = DateTime.UtcNow;
        verification.AdminNotes = req.AdminNotes;

        if (verification.User != null && req.Status == "Approved")
        {
            verification.User.VerificationStatus = VerificationStatus.Approved;
        }

        await _context.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // ─────────────────────────────────────────────
    // STAFF (Super Admin only)
    // ─────────────────────────────────────────────

    [HttpGet("staff")]
    [AllowAnonymous]
    public async Task<IActionResult> GetStaff()
    {
        var admins = await _context.Users
            .Where(u => u.IsAdmin)
            .OrderByDescending(u => u.CreatedAt)
            .ToListAsync();

        return Ok(admins.Select(u => new
        {
            id = u.Id.ToString(),
            name = !string.IsNullOrEmpty(u.RealName) ? u.RealName : u.AnonymousUsername,
            email = u.Email,
            role = u.Email.EndsWith("@finding.app") ? "Super Admin" : "Admin",
            status = u.IsActive ? "active" : "inactive",
            lastLogin = u.UpdatedAt.ToString("o"),
            permissions = u.Email.EndsWith("@finding.app")
                ? new[] { "all" }
                : new[] { "users.view", "users.status", "confessions.moderate", "reports.resolve" }
        }));
    }

    [HttpPost("staff")]
    [AllowAnonymous]
    public async Task<IActionResult> AddStaff([FromBody] AddStaffRequest req)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == req.Email);
        if (user == null) return NotFound(new { error = "User with that email not found. They must register first." });

        user.IsAdmin = true;
        user.UpdatedAt = DateTime.UtcNow;
        _userRepo.Update(user);
        await _userRepo.SaveChangesAsync();
        return Ok(new { success = true, id = user.Id.ToString(), name = user.AnonymousUsername, email = user.Email, role = "Admin", status = "active" });
    }

    [HttpPatch("staff/{adminId}/status")]
    [AllowAnonymous]
    public async Task<IActionResult> ToggleStaffStatus(string adminId, [FromBody] UpdateStatusRequest req)
    {
        if (!Guid.TryParse(adminId, out var id)) return BadRequest();
        var user = await _userRepo.GetByIdAsync(id);
        if (user == null) return NotFound();
        user.IsActive = req.Status == "active";
        user.UpdatedAt = DateTime.UtcNow;
        _userRepo.Update(user);
        await _userRepo.SaveChangesAsync();
        return Ok(new { success = true });
    }

    // ─────────────────────────────────────────────
    // AUDIT LOGS
    // ─────────────────────────────────────────────

    [HttpGet("audit-logs")]
    [AllowAnonymous]
    public async Task<IActionResult> GetAuditLogs()
    {
        var recentDeleted = await _context.Confessions
            .Where(c => c.IsDeleted)
            .OrderByDescending(c => c.CreatedAt)
            .Take(10)
            .ToListAsync();

        var logs = recentDeleted.Select((c, i) => new
        {
            id = $"log-c{i}",
            adminName = "Admin",
            action = "Deleted Confession",
            target = $"Confession #{c.Id.ToString()[..8]}",
            timestamp = c.CreatedAt.ToString("o"),
            type = "content"
        }).ToList<object>();

        return Ok(logs);
    }

    // ─────────────────────────────────────────────
    // AUTH
    // ─────────────────────────────────────────────

    [HttpPost("auth/login")]
    [AllowAnonymous]
    public async Task<IActionResult> AdminLogin([FromBody] AdminLoginRequest req)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == req.Username || u.Email == req.Email);
        if (user == null || !user.IsAdmin)
            return Unauthorized(new { error = "Not an admin account" });

        return Ok(new
        {
            token = Request.Headers["Authorization"].ToString().Replace("Bearer ", ""),
            user = new { name = user.AnonymousUsername, role = user.Email.EndsWith("@finding.app") ? "Super Admin" : "Admin" }
        });
    }
}

// ── Request DTOs ──────────────────────────────────────
public record UpdateStatusRequest(string Status);
public record ModerateRequest(string Status);
public record PromoteRequest(bool IsAdmin);
public record ResolveReportRequest(string Status);
public record ReviewVerificationRequest(string VerificationId, string Status, string? AdminNotes);
public record AddStaffRequest(string Email, string Role);
public record AdminLoginRequest(string? Username, string? Email, string? Password);
