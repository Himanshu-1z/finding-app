using FindingAPI.Data;
using FindingAPI.Models.Entities;
using Microsoft.EntityFrameworkCore;

namespace FindingAPI.Repositories;

public class ChatRepository : Repository<ChatRoom>, IChatRepository
{
    public ChatRepository(AppDbContext context) : base(context) { }

    public async Task<List<ChatRoom>> GetUserChatRoomsAsync(Guid userId)
    {
        return await _dbSet
            .Where(c => (c.User1Id == userId || c.User2Id == userId) && c.IsActive)
            .Include(c => c.User1)
            .Include(c => c.User2)
            .Include(c => c.Messages.OrderByDescending(m => m.SentAt).Take(1))
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<ChatMessage>> GetMessagesAsync(Guid chatRoomId, int page, int pageSize)
    {
        return await _context.ChatMessages
            .Where(m => m.ChatRoomId == chatRoomId)
            .OrderByDescending(m => m.SentAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Include(m => m.Sender)
            .ToListAsync();
    }

    public async Task AddMessageAsync(ChatMessage message)
    {
        await _context.ChatMessages.AddAsync(message);
    }
}
