using FindingAPI.Models.Enums;

namespace FindingAPI.Models.Entities;

public class Report
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ReportedByUserId { get; set; }
    public User ReportedByUser { get; set; } = null!;
    public Guid ReportedUserId { get; set; }
    public User ReportedUser { get; set; } = null!;
    public ReportReason Reason { get; set; }
    public string? Details { get; set; }
    public ReportStatus Status { get; set; } = ReportStatus.Pending;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }
}
