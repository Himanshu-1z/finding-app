using FindingAPI.Models.Enums;

namespace FindingAPI.Models.Entities;

public class InteractionRequest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ConfessionId { get; set; }
    public Confession Confession { get; set; } = null!;
    public Guid TargetUserId { get; set; }
    public User TargetUser { get; set; } = null!;
    public Guid ConfessorId { get; set; }
    public User Confessor { get; set; } = null!;
    public InteractionResponse TargetResponse { get; set; } = InteractionResponse.Pending;
    public ConfessorResponse ConfessorAction { get; set; } = ConfessorResponse.Pending;
    public ChatRoom? ChatRoom { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? RespondedAt { get; set; }
}
