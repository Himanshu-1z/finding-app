using FindingAPI.Data;
using FindingAPI.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace FindingAPI.Repositories;

public class ConfessionRepository : Repository<Confession>, IConfessionRepository
{
    public ConfessionRepository(AppDbContext context) : base(context) { }

    public async Task<List<Confession>> GetPublicFeedAsync(int page, int pageSize)
    {
        return await _dbSet
            .Where(c => !c.IsDeleted && c.IsApproved && c.IsPublic)
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(c => c.Author)
            .ToListAsync();
    }

    public async Task<int> GetPublicFeedCountAsync()
    {
        return await _dbSet.CountAsync(c => !c.IsDeleted && c.IsApproved && c.IsPublic);
    }

    public async Task<List<Confession>> GetTargetedForUserAsync(Guid userId)
    {
        return await _dbSet
            .Where(c => c.TargetUserId == userId && !c.IsDeleted)
            .OrderByDescending(c => c.CreatedAt)
            .Include(c => c.Author)
            .ToListAsync();
    }

    public async Task<List<Confession>> GetMyConfessionsAsync(Guid userId)
    {
        return await _dbSet
            .Where(c => c.AuthorId == userId && !c.IsDeleted)
            .OrderByDescending(c => c.CreatedAt)
            .Include(c => c.Author)
            .ToListAsync();
    }
}
