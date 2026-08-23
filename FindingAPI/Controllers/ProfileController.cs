using System.Security.Claims;
using FindingAPI.DTOs.Profile;
using FindingAPI.Models.Entities;
using FindingAPI.Models.Enums;
using FindingAPI.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FindingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ProfileController : ControllerBase
{
    private readonly IUserRepository _userRepo;

    public ProfileController(IUserRepository userRepo) => _userRepo = userRepo;

    private Guid CurrentUserId
    {
        get
        {
            var idClaim = User.FindFirstValue("uid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            return Guid.TryParse(idClaim, out var id) ? id : Guid.Empty;
        }
    }

    private string CurrentMysteryName
    {
        get
        {
            return User.FindFirstValue("mystery_name") ?? User.FindFirstValue("unique_name") ?? "user";
        }
    }

    private string CurrentEmail
    {
        get
        {
            return User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue("email") ?? "";
        }
    }

    /// <summary>
    /// Ensures the user exists in SQL Server. If not (migrated token from old DB), creates a shell profile.
    /// </summary>
    private async Task<User> EnsureUserExistsAsync()
    {
        var userId = CurrentUserId;
        if (userId == Guid.Empty) return null!;

        var user = await _userRepo.GetByIdAsync(userId);
        if (user != null) return user;

        // User has a valid JWT (from old DB or guest) but doesn't exist in new SQL Server yet
        // Auto-create a shell profile so the session stays active
        user = new User
        {
            Id = userId,
            AnonymousUsername = CurrentMysteryName,
            Email = string.IsNullOrEmpty(CurrentEmail) ? $"user_{userId:N}@finding.app" : CurrentEmail,
            PasswordHash = "migrated_hash",
            CollegeName = "",
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
            // Concurrent insert — try fetching again
            user = await _userRepo.GetByIdAsync(userId);
        }

        return user!;
    }

    [HttpGet("me")]
    [AllowAnonymous]
    public async Task<IActionResult> GetMyProfile()
    {
        var user = await EnsureUserExistsAsync();
        if (user == null) return Unauthorized(new { error = "Invalid or missing token." });

        return Ok(new
        {
            id = user.Id,
            mysteryName = user.AnonymousUsername,
            email = user.Email,
            realName = user.RealName,
            college = user.CollegeName,
            branch = user.Branch,
            department = user.Department,
            yearSemester = user.YearSemester,
            bio = user.Bio,
            avatarUrl = user.AvatarUrl,
            gender = user.Gender.ToString(),
            isAdmin = user.IsAdmin,
            isSetupComplete = user.IsSetupComplete,
            section = user.Section,
            mobileNumber = user.MobileNumber,
            verificationStatus = user.VerificationStatus.ToString(),
            interests = user.Interests,
            dateOfBirth = user.DateOfBirth,
            isIdentityRevealed = user.IsIdentityRevealed
        });
    }

    [HttpGet("user/{userId:guid}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetUserProfile(Guid userId)
    {
        var user = await _userRepo.GetByIdAsync(userId);
        if (user == null) return NotFound(new { error = "User not found" });

        return Ok(new
        {
            id = user.Id,
            mysteryName = user.AnonymousUsername,
            realName = user.IsIdentityRevealed ? user.RealName : "",
            college = user.CollegeName,
            branch = user.Branch,
            department = user.Department,
            yearSemester = user.YearSemester,
            bio = user.Bio,
            avatarUrl = user.AvatarUrl,
            gender = user.Gender.ToString(),
            verificationStatus = user.VerificationStatus.ToString(),
            interests = user.Interests
        });
    }


    [HttpPut("me")]
    [AllowAnonymous]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
    {
        var user = await EnsureUserExistsAsync();
        if (user == null) return Unauthorized();

        if (request.RealName != null) user.RealName = request.RealName;
        if (request.Bio != null) user.Bio = request.Bio;
        if (request.AvatarUrl != null) user.AvatarUrl = request.AvatarUrl;
        if (request.College != null) user.CollegeName = request.College;
        if (request.Branch != null) user.Branch = request.Branch;
        if (request.YearSemester != null) user.YearSemester = request.YearSemester;
        if (request.MobileNumber != null) user.MobileNumber = request.MobileNumber;
        if (request.Section != null) user.Section = request.Section;
        user.IsSetupComplete = true;
        user.UpdatedAt = DateTime.UtcNow;

        _userRepo.Update(user);
        await _userRepo.SaveChangesAsync();
        return Ok(new { success = true });
    }

    [HttpPost("setup-complete")]
    [AllowAnonymous]
    public async Task<IActionResult> SetupComplete()
    {
        var user = await EnsureUserExistsAsync();
        if (user == null) return Unauthorized();
        user.IsSetupComplete = true;
        _userRepo.Update(user);
        await _userRepo.SaveChangesAsync();
        return Ok(new { success = true });
    }
}
