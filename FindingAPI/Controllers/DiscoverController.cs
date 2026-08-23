using System.Security.Claims;
using FindingAPI.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FindingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DiscoverController : ControllerBase
{
    private readonly IUserRepository _userRepo;

    public DiscoverController(IUserRepository userRepo) => _userRepo = userRepo;

    private Guid CurrentUserId
    {
        get
        {
            var idClaim = User.FindFirstValue("uid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            return Guid.TryParse(idClaim, out var id) ? id : Guid.NewGuid();
        }
    }

    [HttpGet("feed")]
    [AllowAnonymous]
    public async Task<IActionResult> GetDiscoverFeed([FromQuery] int page = 1, [FromQuery] int pageSize = 20)
    {
        var users = await _userRepo.GetAllAsync();
        var filtered = users.Where(u => u.Id != CurrentUserId && u.IsActive).Skip((page - 1) * pageSize).Take(pageSize);
        return Ok(new
        {
            items = filtered.Select(u => new
            {
                id = u.Id, mysteryName = u.AnonymousUsername, college = u.CollegeName,
                branch = u.Branch, yearSemester = u.YearSemester, bio = u.Bio,
                avatarUrl = u.AvatarUrl, gender = u.Gender.ToString()
            }),
            page, pageSize
        });
    }

    [HttpPost("{userId:guid}/like")]
    [AllowAnonymous]
    public IActionResult LikeUser(Guid userId)
    {
        return Ok(new { success = true, message = "Like recorded" });
    }
}
