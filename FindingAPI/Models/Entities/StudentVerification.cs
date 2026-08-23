using FindingAPI.Models.Enums;

namespace FindingAPI.Models.Entities;

public class StudentVerification
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string StudentIdPhotoUrl { get; set; } = string.Empty;
    public string? ExtractedName { get; set; }
    public string? ExtractedStudentId { get; set; }
    public string? ExtractedCollege { get; set; }
    public float OcrConfidence { get; set; } = 0.85f;
    public VerificationStatus Status { get; set; } = VerificationStatus.Pending;
    public string? AdminNotes { get; set; }
    public Guid? ReviewedByAdminId { get; set; }
    public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ReviewedAt { get; set; }
}
