namespace FindingAPI.Models.Entities;

public class ChatMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ChatRoomId { get; set; }
    public ChatRoom ChatRoom { get; set; } = null!;
    public Guid SenderId { get; set; }
    public User Sender { get; set; } = null!;
    public string Content { get; set; } = string.Empty;
    public string? Image { get; set; }
    public string? FileName { get; set; }
    public string? FileSize { get; set; }
    public bool IsRead { get; set; } = false;
    public DateTime SentAt { get; set; } = DateTime.UtcNow;
}
