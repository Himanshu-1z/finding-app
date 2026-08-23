using FindingAPI.Data;
using FindingAPI.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace FindingAPI.Repositories;

public class InteractionRepository : Repository<InteractionRequest>, IInteractionRepository
{
    public InteractionRepository(AppDbContext context) : base(context) { }

    public async Task<InteractionRequest?> GetByConfessionAndTargetAsync(Guid confessionId, Guid targetUserId)
    {
        return await _dbSet
            .Include(i => i.Confession)
            .Include(i => i.ChatRoom)
            .FirstOrDefaultAsync(i => i.ConfessionId == confessionId && i.TargetUserId == targetUserId);
    }
}
