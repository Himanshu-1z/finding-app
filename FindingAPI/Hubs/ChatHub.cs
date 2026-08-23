using Microsoft.AspNetCore.SignalR;

namespace FindingAPI.Hubs;

public class ChatHub : Hub
{
    public async Task SendMessage(string chatRoomId, string senderId, string senderName, string message)
    {
        await Clients.Group(chatRoomId).SendAsync("ReceiveMessage", new
        {
            id = Guid.NewGuid().ToString(),
            chatRoomId,
            senderId,
            senderName,
            content = message,
            text = message,
            sentAt = DateTime.UtcNow,
            time = DateTime.UtcNow.ToString("t")
        });
    }

    public async Task SendTyping(string chatRoomId, string senderId, string senderName, bool isTyping)
    {
        await Clients.OthersInGroup(chatRoomId).SendAsync("UserTyping", new
        {
            chatRoomId,
            senderId,
            senderName,
            isTyping
        });
    }

    public async Task JoinRoom(string chatRoomId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, chatRoomId);
    }

    public async Task LeaveRoom(string chatRoomId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, chatRoomId);
    }
}
