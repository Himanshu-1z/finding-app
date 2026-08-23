using FindingAPI.Models.Enums;

namespace FindingAPI.Models.Entities;

public class Confession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid AuthorId { get; set; }
    public User Author { get; set; } = null!;
    public string Content { get; set; } = string.Empty;
    public ConfessionType Type { get; set; } = ConfessionType.Public;
    public string? TargetRealName { get; set; }
    public string? TargetCollege { get; set; }
    public string? TargetSemester { get; set; }
    public string? AuthorCollege { get; set; }
    public Guid? TargetUserId { get; set; }
    public User? TargetUser { get; set; }
    public bool IsPublic { get; set; } = true;
    public int LikesCount { get; set; } = 0;
    public bool IsApproved { get; set; } = true;
    public bool IsDeleted { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public ICollection<InteractionRequest> InteractionRequests { get; set; } = new List<InteractionRequest>();
    public ICollection<ConfessionComment> Comments { get; set; } = new List<ConfessionComment>();
}
