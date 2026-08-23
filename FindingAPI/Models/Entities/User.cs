using FindingAPI.Models.Enums;

namespace FindingAPI.Models.Entities;

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string AnonymousUsername { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string RealName { get; set; } = string.Empty;
    public string StudentIdNumber { get; set; } = string.Empty;
    public string StudentIdPhotoUrl { get; set; } = string.Empty;
    public string CollegeName { get; set; } = string.Empty;
    public string Branch { get; set; } = string.Empty;
    public string Department { get; set; } = string.Empty;
    public string YearSemester { get; set; } = string.Empty;
    public string MobileNumber { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? Bio { get; set; }
    public string? Interests { get; set; }
    public VerificationStatus VerificationStatus { get; set; } = VerificationStatus.Pending;
    public bool IsActive { get; set; } = true;
    public bool IsAdmin { get; set; } = false;
    public string? RefreshToken { get; set; }
    public DateTime? RefreshTokenExpiry { get; set; }
    public Gender Gender { get; set; } = Gender.Other;
    public DateOnly DateOfBirth { get; set; } = new DateOnly(2002, 1, 1);
    public bool IsIdentityRevealed { get; set; } = false;
    public string Section { get; set; } = string.Empty;
    public string? CapturedIdImage { get; set; }
    public bool IsSetupComplete { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<UserInterest> UserInterests { get; set; } = new List<UserInterest>();
    public ICollection<Confession> ConfessionsMade { get; set; } = new List<Confession>();
    public ICollection<Confession> ConfessionsTargeted { get; set; } = new List<Confession>();
    public ICollection<InteractionRequest> SentInteractions { get; set; } = new List<InteractionRequest>();
    public ICollection<InteractionRequest> ReceivedInteractions { get; set; } = new List<InteractionRequest>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<Report> ReportsMade { get; set; } = new List<Report>();
    public ICollection<Report> ReportsReceived { get; set; } = new List<Report>();
}
