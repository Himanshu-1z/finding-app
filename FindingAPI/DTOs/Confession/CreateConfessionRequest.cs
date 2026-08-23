namespace FindingAPI.DTOs.Confession;

public class CreateConfessionRequest
{
    public string Content { get; set; } = string.Empty;
    public string? TargetPerson { get; set; }
    public string? TargetCollege { get; set; }
    public string? TargetSemester { get; set; }
    public string? Type { get; set; } = "public";
}
