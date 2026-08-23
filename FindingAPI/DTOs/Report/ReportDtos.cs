namespace FindingAPI.DTOs.Report;

public class CreateReportRequest
{
    public Guid ReportedUserId { get; set; }
    public int Reason { get; set; }
    public string? Details { get; set; }
}
