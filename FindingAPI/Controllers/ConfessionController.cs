using System.Security.Claims;
using FindingAPI.DTOs.Confession;
using FindingAPI.Models.Entities;
using FindingAPI.Models.Enums;
using FindingAPI.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FindingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ConfessionController : ControllerBase
{
    private readonly IConfessionRepository _confessionRepo;
    private readonly IUserRepository _userRepo;

    public ConfessionController(IConfessionRepository confessionRepo, IUserRepository userRepo)
    {
        _confessionRepo = confessionRepo;
        _userRepo = userRepo;
    }

    private Guid CurrentUserId
    {
        get
        {
            var idClaim = User.FindFirstValue("uid")
                ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User.FindFirstValue("sub");
            return Guid.TryParse(idClaim, out var id) ? id : Guid.NewGuid();
        }
    }

    [HttpGet("feed")]
    [AllowAnonymous]
    public async Task<IActionResult> GetPublicFeed([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var items = await _confessionRepo.GetPublicFeedAsync(page, pageSize);
        var totalCount = await _confessionRepo.GetPublicFeedCountAsync();

        return Ok(new
        {
            items = items.Select(c => new
            {
                id = c.Id,
                author = c.Author?.AnonymousUsername ?? "Anonymous",
                authorMysteryName = c.Author?.AnonymousUsername ?? "Anonymous",
                authorId = c.AuthorId,
                authorCollege = !string.IsNullOrEmpty(c.AuthorCollege) ? c.AuthorCollege : (c.Author?.CollegeName ?? ""),
                authorBranch = c.Author?.Branch ?? "",
                authorYear = c.Author?.YearSemester ?? "",

                content = c.Content,
                type = c.Type.ToString().ToLower(),
                targetPerson = c.TargetRealName,
                likesCount = c.LikesCount,
                createdAt = c.CreatedAt,
                isMine = c.AuthorId == CurrentUserId
            }),
            totalCount,
            page,
            pageSize
        });
    }

    [HttpGet("my")]
    [AllowAnonymous]
    public async Task<IActionResult> GetMyConfessions()
    {
        var userId = CurrentUserId;
        var items = await _confessionRepo.GetMyConfessionsAsync(userId);
        return Ok(items.Select(c => new
        {
            id = c.Id,
            author = c.Author?.AnonymousUsername ?? "Anonymous",
            authorMysteryName = c.Author?.AnonymousUsername ?? "Anonymous",
            authorId = c.AuthorId,
            authorCollege = !string.IsNullOrEmpty(c.AuthorCollege) ? c.AuthorCollege : (c.Author?.CollegeName ?? ""),
            authorBranch = c.Author?.Branch ?? "",
            authorYear = c.Author?.YearSemester ?? "",
            content = c.Content,
            type = c.Type.ToString().ToLower(),
            targetPerson = c.TargetRealName,
            likesCount = c.LikesCount,
            createdAt = c.CreatedAt,
            isMine = true
        }));
    }

    [HttpGet("user/{userId:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetUserConfessions(Guid userId)
    {
        var items = await _confessionRepo.GetMyConfessionsAsync(userId);
        return Ok(items.Select(c => new
        {
            id = c.Id,
            author = c.Author?.AnonymousUsername ?? "Anonymous",
            authorMysteryName = c.Author?.AnonymousUsername ?? "Anonymous",
            authorId = c.AuthorId,
            authorCollege = !string.IsNullOrEmpty(c.AuthorCollege) ? c.AuthorCollege : (c.Author?.CollegeName ?? ""),
            authorBranch = c.Author?.Branch ?? "",
            authorYear = c.Author?.YearSemester ?? "",
            content = c.Content,
            type = c.Type.ToString().ToLower(),
            targetPerson = c.TargetRealName,
            likesCount = c.LikesCount,
            createdAt = c.CreatedAt,
            isMine = c.AuthorId == CurrentUserId
        }));
    }


    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> CreateConfession([FromBody] CreateConfessionRequest body)
    {
        var userId = CurrentUserId;
        var user = await _userRepo.GetByIdAsync(userId);
        if (user == null)
        {
            user = new User
            {
                Id = userId,
                AnonymousUsername = User.FindFirstValue("mystery_name") ?? ("Storyteller_" + Guid.NewGuid().ToString("N")[..6]),
                Email = User.FindFirstValue(ClaimTypes.Email) ?? $"user_{userId:N}@finding.app",
                PasswordHash = "guest_hash",
                RealName = "",
                StudentIdNumber = "",
                StudentIdPhotoUrl = "",
                CollegeName = "Campus",
                Branch = "",
                Department = "",
                YearSemester = "",
                MobileNumber = "",
                Section = "",
                IsActive = true
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

        var confession = new Confession
        {
            AuthorId = user?.Id ?? userId,
            Content = body.Content,
            Type = body.Type?.ToLower() == "tagged" ? ConfessionType.Targeted : ConfessionType.Public,
            TargetRealName = body.TargetPerson,
            TargetCollege = body.TargetCollege ?? user?.CollegeName ?? "",
            TargetSemester = body.TargetSemester ?? user?.YearSemester ?? "",
            AuthorCollege = user?.CollegeName ?? "",
            IsPublic = body.Type?.ToLower() != "tagged",
            IsApproved = true
        };

        await _confessionRepo.AddAsync(confession);
        await _confessionRepo.SaveChangesAsync();

        return Ok(new
        {
            id = confession.Id,
            content = confession.Content,
            author = user?.AnonymousUsername ?? "Anonymous",
            authorCollege = confession.AuthorCollege,
            authorBranch = user?.Branch ?? "",
            authorYear = user?.YearSemester ?? "",
            isAnonymous = true,
            createdAt = confession.CreatedAt
        });
    }

    [HttpGet("targeted")]
    [AllowAnonymous]
    public async Task<IActionResult> GetTargeted()
    {
        var items = await _confessionRepo.GetTargetedForUserAsync(CurrentUserId);
        return Ok(items.Select(c => new
        {
            id = c.Id,
            author = c.Author?.AnonymousUsername ?? "Anonymous",
            authorMysteryName = c.Author?.AnonymousUsername ?? "Anonymous",
            authorCollege = c.AuthorCollege ?? c.Author?.CollegeName ?? "",
            authorBranch = c.Author?.Branch ?? "",
            authorYear = c.Author?.YearSemester ?? "",
            content = c.Content,
            targetPerson = c.TargetRealName,
            likesCount = c.LikesCount,
            createdAt = c.CreatedAt
        }));
    }

    [HttpPost("{id:guid}/like")]
    [AllowAnonymous]
    public async Task<IActionResult> Like(Guid id)
    {
        var confession = await _confessionRepo.GetByIdAsync(id);
        if (confession == null) return NotFound();

        confession.LikesCount += 1;
        _confessionRepo.Update(confession);
        await _confessionRepo.SaveChangesAsync();

        return Ok(new { likes = confession.LikesCount });
    }
}
