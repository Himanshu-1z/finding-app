using FindingAPI.Models.Entities;

namespace FindingAPI.Repositories;

public interface INotificationRepository : IRepository<Notification>
{
    Task<List<Notification>> GetUserNotificationsAsync(Guid userId, int page, int pageSize);
    Task MarkAllAsReadAsync(Guid userId);
}
