import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MessageSquare, Sparkles, Lock, X, CheckCheck, CircleDot, ArrowRight } from "lucide-react";
import { useAppStore, useChats } from "../store/AppContext";
import { chatService } from "../services/apiClient";

export function ChatList() {
  const navigate = useNavigate();
  const { dispatch } = useAppStore();
  const chatsStore = useChats();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(false);

  const fetchLiveChats = (silent = true) => {
    if (!silent) setLoading(true);
    chatService.getMyChatRooms(silent)
      .then((res: any) => {
        const rawRooms = Array.isArray(res) ? res : (res?.items || res?.threads || []);
        if (Array.isArray(rawRooms)) {
          const mapped = rawRooms.map((room: any) => {
            const partnerName = room.name || room.partnerName || "Anonymous";
            return {
              id: (room.id || room.Id)?.toString(),
              name: partnerName,
              letter: room.letter || (partnerName ? partnerName.charAt(0).toUpperCase() : "A"),
              status: room.status || "Online",
              lastMessage: room.lastMessage || "Chat room created! Say hello 👋",
              time: room.time || "Recently",
              lastActiveTime: room.lastActiveTime || (room.createdAt ? new Date(room.createdAt).getTime() : 0),
              unread: Boolean(room.unread),
              messages: room.messages || [],
              partnerId: room.partnerId?.toString(),
              createdAt: room.createdAt
            };
          });
          dispatch({ type: "SET_CHATS", chats: mapped });
        }
      })
      .catch((err) => console.warn("Live chats fetch notice:", err))
      .finally(() => {
        if (!silent) setLoading(false);
      });
  };

  useEffect(() => {
    fetchLiveChats(true);
    const interval = setInterval(() => {
      fetchLiveChats(true);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  // Sort chats so recent ones are on top
  const sortedChats = [...chatsStore].sort((a: any, b: any) => {
    if (a.unread && !b.unread) return -1;
    if (!a.unread && b.unread) return 1;
    const timeA = a.lastActiveTime || (a.createdAt ? new Date(a.createdAt).getTime() : 0);
    const timeB = b.lastActiveTime || (b.createdAt ? new Date(b.createdAt).getTime() : 0);
    return timeB - timeA;
  });

  const filteredChats = sortedChats.filter((chat) => {
    const matchesSearch =
      chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === "unread") {
      return matchesSearch && chat.unread;
    }
    return matchesSearch;
  });

  const handleOpenChat = (chat: any) => {
    dispatch({ type: "MARK_CHAT_READ", chatId: chat.id });
    navigate(`/chat/${chat.id}`, {
      state: {
        name: chat.name,
        letter: chat.letter,
        status: chat.status,
      },
    });
  };

  const unreadCount = chatsStore.filter((c) => c.unread).length;

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col min-h-screen pb-24 px-4 pt-4 space-y-5">
      {/* ─── HEADER BAR ─── */}
      <div className="flex items-center justify-between pt-1">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-on-surface">Recent Chats</h1>
            {unreadCount > 0 && (
              <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-primary text-on-primary animate-pulse">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-xs text-on-surface-variant">Live anonymous conversations with campus peers</p>
        </div>

        <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-3 py-1 rounded-full border border-primary/20 text-xs font-bold">
          <Lock className="w-3.5 h-3.5" />
          <span>Encrypted</span>
        </div>
      </div>

      {/* ─── TOP ACTIVE CONNECTIONS REEL ─── */}
      {chatsStore.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-on-surface-variant px-1">
            <span className="flex items-center gap-1 text-primary">
              <Sparkles className="w-3 h-3 text-primary animate-spin-slow" /> Active Connections
            </span>
            <span className="text-[10px] text-on-surface-variant/70">{chatsStore.length} total</span>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto py-2 px-1 hide-scrollbar">
            {chatsStore.map((chat) => (
              <button
                key={`reel-${chat.id}`}
                onClick={() => handleOpenChat(chat)}
                className="flex flex-col items-center gap-1 shrink-0 group cursor-pointer"
              >
                <div className="relative p-0.5 rounded-full bg-gradient-to-tr from-primary via-tertiary to-rose-400 group-hover:scale-105 transition-transform duration-200">
                  <div className="w-13 h-13 rounded-full bg-surface-container-high border-2 border-surface flex items-center justify-center overflow-hidden">
                    <img
                      src={`https://api.dicebear.com/7.x/fun-emoji/svg?seed=${chat.name}&backgroundColor=c0aede`}
                      alt={chat.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-surface" />
                </div>
                <span className="text-[11px] font-bold text-on-surface max-w-[64px] truncate text-center group-hover:text-primary transition-colors">
                  @{chat.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── SEARCH & FILTER TABS ─── */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 neo-inset bg-surface rounded-2xl overflow-hidden flex items-center px-4 py-3">
            <Search className="w-4 h-4 text-outline mr-2 shrink-0 text-primary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations by student @name or message..."
              className="w-full bg-transparent text-sm text-on-surface placeholder:text-outline-variant focus:outline-none"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-on-surface-variant hover:text-primary p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex gap-1.5 p-1 rounded-2xl bg-surface-container-low border border-outline-variant/60">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "all"
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              All ({chatsStore.length})
            </button>
            <button
              onClick={() => setActiveTab("unread")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === "unread"
                  ? "bg-primary text-on-primary shadow-xs"
                  : "text-on-surface-variant hover:text-primary"
              }`}
            >
              Unread {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>
        </div>
      </div>

      {/* ─── CHAT CONVERSATIONS LIST ─── */}
      <div className="space-y-2.5 pt-1">
        {filteredChats.length === 0 ? (
          <div className="neo-inset rounded-3xl p-10 text-center text-on-surface-variant space-y-3 bg-surface-container-lowest border border-outline-variant">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-on-surface">No active conversations</h3>
              <p className="text-xs text-on-surface-variant mt-1 max-w-xs mx-auto">
                {searchQuery
                  ? "No chats matched your search query."
                  : "Send an interaction request on the campus feed or accept incoming requests to start live messaging!"}
              </p>
            </div>
            {!searchQuery && (
              <button
                onClick={() => navigate("/feed")}
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-on-primary font-bold text-xs shadow-sm hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                Browse Campus Feed <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          filteredChats.map((chat) => (
            <div
              key={chat.id}
              onClick={() => handleOpenChat(chat)}
              className={`rounded-2xl p-4 flex items-center gap-3.5 cursor-pointer transition-all duration-200 active:scale-[0.99] border hover:shadow-md ${
                chat.unread
                  ? "bg-surface-container-high border-primary/40 shadow-sm ring-1 ring-primary/20"
                  : "bg-surface-container-low hover:bg-surface-container border-outline-variant/60 shadow-2xs"
              }`}
            >
              {/* Avatar with dynamic seed */}
              <div className="relative w-13 h-13 rounded-full overflow-hidden flex-shrink-0 bg-surface border border-outline-variant/80 shadow-inner">
                <img
                  src={`https://api.dicebear.com/7.x/fun-emoji/svg?seed=${chat.name}&backgroundColor=ffd5dc`}
                  alt={chat.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-surface" />
              </div>

              {/* Chat Content */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline mb-0.5">
                  <div className="flex items-center gap-1.5 truncate">
                    <h2 className="font-bold text-sm truncate text-on-surface">
                      @{chat.name}
                    </h2>
                    {chat.unread && (
                      <span className="w-2 h-2 rounded-full bg-primary inline-block shrink-0" />
                    )}
                  </div>
                  <span className={`text-[11px] font-semibold shrink-0 ml-2 ${
                    chat.unread ? "text-primary font-bold" : "text-on-surface-variant/70"
                  }`}>
                    {chat.time}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <p className={`text-xs truncate ${
                    chat.unread ? "font-bold text-on-surface" : "text-on-surface-variant font-medium"
                  }`}>
                    {chat.lastMessage}
                  </p>

                  {chat.unread && (
                    <span className="shrink-0 w-5 h-5 rounded-full bg-primary text-on-primary text-[10px] font-extrabold flex items-center justify-center shadow-xs">
                      1
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
