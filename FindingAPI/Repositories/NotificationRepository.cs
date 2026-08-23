using FindingAPI.Data;
using FindingAPI.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace FindingAPI.Repositories;

public class NotificationRepository : Repository<Notification>, INotificationRepository
{
    public NotificationRepository(AppDbContext context) : base(context) { }

    public async Task<List<Notification>> GetUserNotificationsAsync(Guid userId, int page, int pageSize)
    {
        return await _dbSet
            .Where(n => n.UserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();
    }

    public async Task MarkAllAsReadAsync(Guid userId)
    {
        var unread = await _dbSet.Where(n => n.UserId == userId && !n.IsRead).ToListAsync();
        foreach (var n in unread) n.IsRead = true;
    }
}
