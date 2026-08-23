using System.Security.Claims;
using FindingAPI.DTOs.Report;
using FindingAPI.Models.Entities;
using FindingAPI.Models.Enums;
using FindingAPI.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FindingAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportController : ControllerBase
{
    private readonly IReportRepository _reportRepo;

    public ReportController(IReportRepository reportRepo) => _reportRepo = reportRepo;

    private Guid CurrentUserId
    {
        get
        {
            var idClaim = User.FindFirstValue("uid") ?? User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
            return Guid.TryParse(idClaim, out var id) ? id : Guid.NewGuid();
        }
    }

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> CreateReport([FromBody] CreateReportRequest request)
    {
        var report = new Report
        {
            ReportedByUserId = CurrentUserId,
            ReportedUserId = request.ReportedUserId,
            Reason = (ReportReason)request.Reason,
            Details = request.Details
        };
        await _reportRepo.AddAsync(report);
        await _reportRepo.SaveChangesAsync();
        return Ok(new { success = true, reportId = report.Id });
    }
}
