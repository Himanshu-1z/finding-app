using FindingAPI.Models.Entities;

namespace FindingAPI.Repositories;

public interface IChatRepository : IRepository<ChatRoom>
{
    Task<List<ChatRoom>> GetUserChatRoomsAsync(Guid userId);
    Task<List<ChatMessage>> GetMessagesAsync(Guid chatRoomId, int page, int pageSize);
    Task AddMessageAsync(ChatMessage message);
}
