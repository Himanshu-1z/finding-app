namespace FindingAPI.Models.Entities;

public class ChatRoom
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid InteractionRequestId { get; set; }
    public InteractionRequest InteractionRequest { get; set; } = null!;
    public Guid User1Id { get; set; }
    public User User1 { get; set; } = null!;
    public Guid User2Id { get; set; }
    public User User2 { get; set; } = null!;
    public bool IsUnlocked { get; set; } = false;
    public bool IsFreePeriod { get; set; } = true;
    public DateTime FreePeriodEndsAt { get; set; } = DateTime.UtcNow.AddDays(30);
    public Guid? PaymentId { get; set; }
    public Payment? Payment { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}
