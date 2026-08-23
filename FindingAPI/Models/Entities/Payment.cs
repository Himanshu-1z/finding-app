using FindingAPI.Models.Enums;

namespace FindingAPI.Models.Entities;

public class Payment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid ChatRoomId { get; set; }
    public ChatRoom ChatRoom { get; set; } = null!;
    public decimal Amount { get; set; } = 29.00m;
    public string Currency { get; set; } = "INR";
    public PaymentStatus Status { get; set; } = PaymentStatus.Pending;
    public string? TransactionRef { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; }
}
