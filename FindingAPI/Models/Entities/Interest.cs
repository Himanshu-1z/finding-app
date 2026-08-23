namespace FindingAPI.Models.Entities;

public class Interest
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Emoji { get; set; } = "✨";
    public string Category { get; set; } = "General";
}
