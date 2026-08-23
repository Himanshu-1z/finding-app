namespace FindingAPI.DTOs.Auth;

public class RegisterRequest
{
    public string? MysteryName { get; set; }
    public string? Email { get; set; }
    public string? Password { get; set; }
    public string? Gender { get; set; }
    public string? DateOfBirth { get; set; }
    public string? RealName { get; set; }
    public string? College { get; set; }
    public string? YearSemester { get; set; }
    public string? MobileNumber { get; set; }
    public string? CapturedIdImage { get; set; }
}
