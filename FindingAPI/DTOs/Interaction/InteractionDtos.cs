namespace FindingAPI.DTOs.Interaction;

public class RespondToConfessionRequest
{
    public Guid ConfessionId { get; set; }
    public int Response { get; set; }
}

public class ConfessorActionRequest
{
    public Guid InteractionRequestId { get; set; }
    public int Action { get; set; }
}
