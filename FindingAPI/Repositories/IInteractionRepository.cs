using FindingAPI.Models.Entities;

namespace FindingAPI.Repositories;

public interface IInteractionRepository : IRepository<InteractionRequest>
{
    Task<InteractionRequest?> GetByConfessionAndTargetAsync(Guid confessionId, Guid targetUserId);
}
