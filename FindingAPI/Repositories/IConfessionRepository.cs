using FindingAPI.Models.Entities;

namespace FindingAPI.Repositories;

public interface IConfessionRepository : IRepository<Confession>
{
    Task<List<Confession>> GetPublicFeedAsync(int page, int pageSize);
    Task<int> GetPublicFeedCountAsync();
    Task<List<Confession>> GetTargetedForUserAsync(Guid userId);
    Task<List<Confession>> GetMyConfessionsAsync(Guid userId);
}
