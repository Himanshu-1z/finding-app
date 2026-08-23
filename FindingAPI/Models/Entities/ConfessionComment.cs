namespace FindingAPI.Models.Entities;

public class ConfessionComment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ConfessionId { get; set; }
    public Confession Confession { get; set; } = null!;
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
