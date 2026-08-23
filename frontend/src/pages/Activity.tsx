import { useState, useEffect } from "react";
import { EyeOff, Heart, Info, Check, X, MessageSquare, RefreshCw, Send, Bell, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppStore, useConnectionRequests, useConfessions } from "../store/AppContext";
import { interactionService, apiFetch } from "../services/apiClient";

export function Activity() {
  const navigate = useNavigate();
  const { dispatch } = useAppStore();
  const connectionRequests = useConnectionRequests();
  const confessions = useConfessions();
  const [outgoingRequests, setOutgoingRequests] = useState<any[]>([]);
  const [liveNotifications, setLiveNotifications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<"requests" | "confessions" | "activity">("requests");
  const [loadingRequests, setLoadingRequests] = useState(false);

  const fetchLiveAlerts = () => {
    setLoadingRequests(true);

    // 1. Fetch Interaction Requests
    interactionService
      .getMyRequests()
      .then((res: any) => {
        if (res) {
          if (res.incoming && Array.isArray(res.incoming)) {
            const mappedIncoming = res.incoming.map((r: any) => ({
              id: r.id?.toString(),
              fromUser: r.fromUser || "Anonymous",
              avatarUrl: r.avatarUrl || null,
              status: r.status === "accepted" ? "accepted" : r.status === "declined" ? "declined" : "pending",
              confessionContent: r.confessionContent,
              confessionId: r.confessionId,
              createdAt: r.createdAt,
              chatRoomId: r.chatRoomId?.toString(),
            }));
            dispatch({ type: "SET_CONNECTION_REQUESTS", requests: mappedIncoming });
          }

          if (res.outgoing && Array.isArray(res.outgoing)) {
            setOutgoingRequests(
              res.outgoing.map((r: any) => ({
                id: r.id?.toString(),
                toUser: r.toUser || "Author",
                status: r.status === "accepted" ? "accepted" : r.status === "declined" ? "declined" : "pending",
                confessionContent: r.confessionContent,
                confessionId: r.confessionId,
                createdAt: r.createdAt,
                chatRoomId: r.chatRoomId?.toString(),
              }))
            );
          }
        }
      })
      .catch((err) => console.warn("Failed to fetch live requests:", err));

    // 2. Fetch In-App Notifications
    apiFetch("/notifications")
      .then((notifs: any) => {
        if (Array.isArray(notifs)) {
          setLiveNotifications(notifs);
        }
      })
      .catch((err) => console.warn("Failed to fetch notifications:", err))
      .finally(() => setLoadingRequests(false));
  };

  useEffect(() => {
    fetchLiveAlerts();
    const interval = setInterval(fetchLiveAlerts, 3000);
    window.addEventListener("focus", fetchLiveAlerts);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", fetchLiveAlerts);
    };
  }, []);

  const handleAccept = async (id: string) => {
    try {
      const res: any = await interactionService.confessorAction(id, 2); // 2 = Accepted
      dispatch({ type: "ACCEPT_CONNECTION", id });
      fetchLiveAlerts();

      if (res && res.chatRoomId) {
        navigate(`/chat/${res.chatRoomId}`);
      }
    } catch (err: any) {
      console.error("Accept request error:", err);
      alert(err.message || "Failed to accept connection");
    }
  };

  const handleDecline = async (id: string) => {
    try {
      await interactionService.confessorAction(id, 3); // 3 = Declined
      dispatch({ type: "DECLINE_CONNECTION", id });
      fetchLiveAlerts();
    } catch (err: any) {
      console.error("Decline request error:", err);
      alert(err.message || "Failed to decline connection");
    }
  };

  const handleOpenChat = (request: any) => {
    const targetChatId = request.chatRoomId || request.id;
    navigate(`/chat/${targetChatId}`, {
      state: {
        name: request.fromUser || request.toUser || "Peer",
        letter: (request.fromUser || request.toUser || "A").charAt(0).toUpperCase(),
        status: "Online",
      },
    });
  };

  const pendingIncomingCount = connectionRequests.filter((r) => r.status === "pending").length;
  const acceptedOutgoingCount = outgoingRequests.filter((r) => r.status === "accepted").length;

  return (
    <div className="w-full flex flex-col gap-6 max-w-2xl mx-auto pb-24">
      <div className="flex justify-between items-center px-1">
        <div>
          <h1 className="text-3xl font-bold text-primary">Alerts & Chat</h1>
          <p className="text-xs text-on-surface-variant">Live connections, story requests, and alerts</p>
        </div>
        <button
          onClick={fetchLiveAlerts}
          className="p-2.5 rounded-full neo-button text-primary hover:opacity-80 transition-all cursor-pointer shadow-xs bg-surface"
          title="Refresh alerts"
        >
          <RefreshCw className={`w-4 h-4 ${loadingRequests ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="relative w-full">
        <div className="flex gap-2 w-full pb-1">
          <button
            onClick={() => setActiveTab("requests")}
            className={`flex-1 min-w-0 px-2 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "requests"
                ? "bg-primary text-on-primary neo-outset shadow-sm"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span>Connections</span>
            {pendingIncomingCount > 0 && (
              <span className="ml-1.5 bg-red-500 text-white rounded-full px-1.5 py-0.2 text-[10px] animate-pulse">
                {pendingIncomingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("confessions")}
            className={`flex-1 min-w-0 px-2 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "confessions"
                ? "bg-primary text-on-primary neo-outset shadow-sm"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span>My Stories</span>
          </button>
          <button
            onClick={() => setActiveTab("activity")}
            className={`flex-1 min-w-0 px-2 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "activity"
                ? "bg-primary text-on-primary neo-outset shadow-sm"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
            }`}
          >
            <span>Notifications</span>
            {liveNotifications.length > 0 && (
              <span className="ml-1.5 bg-primary/20 text-primary rounded-full px-1.5 py-0.2 text-[10px]">
                {liveNotifications.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {/* ─── TAB 1: REQUESTS & CHATS ─── */}
        {activeTab === "requests" && (
          <div className="space-y-6">
            {/* Incoming Requests Section */}
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-primary" /> Incoming Connection Requests ({connectionRequests.length})
              </h2>

              {connectionRequests.length === 0 ? (
                <div className="text-center py-8 text-xs text-on-surface-variant neo-inset rounded-2xl bg-surface/50">
                  {loadingRequests ? "Loading requests..." : "No incoming connection requests yet."}
                </div>
              ) : (
                connectionRequests.map((request) => (
                  <div key={request.id} className="neo-inset rounded-2xl p-4 sm:p-5 flex flex-col gap-3 bg-surface">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-full shadow-inner flex-shrink-0 bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-primary text-base">
                          {request.fromUser ? request.fromUser.charAt(0).toUpperCase() : "A"}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-on-surface flex items-center gap-2">
                            <span>@{request.fromUser}</span>
                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary uppercase">
                              Story Connect
                            </span>
                          </div>
                          <div className="text-xs text-on-surface-variant mt-0.5">
                            {request.status === "accepted"
                              ? "Connection accepted! Live chat ready."
                              : request.status === "declined"
                              ? "Connection request declined."
                              : "Wants to interact with your story"}
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2 items-center flex-shrink-0">
                        {request.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleDecline(request.id)}
                              className="px-3 py-1.5 rounded-xl text-xs font-bold text-error bg-error/10 hover:bg-error/20 transition-colors cursor-pointer"
                            >
                              Decline
                            </button>
                            <button
                              onClick={() => handleAccept(request.id)}
                              className="px-4 py-1.5 rounded-xl text-xs font-bold text-on-primary bg-primary shadow-sm hover:opacity-90 transition-opacity cursor-pointer flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" /> Accept
                            </button>
                          </>
                        )}
                        {request.status === "accepted" && (
                          <button
                            onClick={() => handleOpenChat(request)}
                            className="px-4 py-2 rounded-xl text-xs font-bold text-on-primary bg-emerald-600 shadow-sm hover:bg-emerald-700 flex items-center gap-1.5 cursor-pointer"
                          >
                            <MessageSquare className="w-4 h-4" /> Chat Now
                          </button>
                        )}
                        {request.status === "declined" && (
                          <span className="px-3 py-1.5 rounded-xl text-xs font-bold text-on-surface-variant bg-surface-container flex items-center gap-1">
                            <X className="w-3.5 h-3.5 text-error" /> Declined
                          </span>
                        )}
                      </div>
                    </div>

                    {request.confessionContent && (
                      <div className="bg-surface-container/60 p-2.5 rounded-xl border border-outline-variant/30 text-xs text-on-surface-variant italic flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                        <span className="line-clamp-1">"{request.confessionContent}"</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Sent Requests Section */}
            {outgoingRequests.length > 0 && (
              <div className="space-y-3 pt-2">
                <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-tertiary" /> Sent Connection Requests ({outgoingRequests.length})
                </h2>
                {outgoingRequests.map((request) => (
                  <div key={request.id} className="neo-inset rounded-2xl p-4 flex flex-col gap-2 bg-surface/80">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-surface-container-high flex items-center justify-center font-bold text-xs text-on-surface">
                          {request.toUser ? request.toUser.charAt(0).toUpperCase() : "A"}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-on-surface">Sent to @{request.toUser}</p>
                          <p className="text-[11px] text-on-surface-variant">
                            {request.status === "accepted"
                              ? "🎉 Accepted! You can now chat."
                              : request.status === "declined"
                              ? "Request was declined."
                              : "Waiting for author's approval..."}
                          </p>
                        </div>
                      </div>

                      <div>
                        {request.status === "accepted" ? (
                          <button
                            onClick={() => handleOpenChat(request)}
                            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-on-primary bg-emerald-600 shadow-sm hover:bg-emerald-700 flex items-center gap-1.5 cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5" /> Start Chat
                          </button>
                        ) : request.status === "declined" ? (
                          <span className="text-xs text-error font-bold px-2 py-1 bg-error/10 rounded-lg">Declined</span>
                        ) : (
                          <span className="text-xs text-amber-600 font-bold px-2.5 py-1 bg-amber-500/10 rounded-full border border-amber-500/20 animate-pulse">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: MY STORIES ─── */}
        {activeTab === "confessions" && (
          <div className="space-y-4">
            {confessions.filter((c) => c.isMine).length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant neo-inset rounded-2xl bg-surface">
                You haven't written any stories yet.
              </div>
            ) : (
              confessions
                .filter((c) => c.isMine)
                .map((confession) => (
                  <div key={confession.id} className="neo-inset rounded-2xl p-5 flex flex-col gap-2 bg-surface">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-on-surface text-sm">@{confession.author}</span>
                      <span className="text-xs text-on-surface-variant">{confession.time}</span>
                    </div>
                    <p className="text-sm text-on-surface-variant">{confession.content}</p>
                    <div className="flex items-center gap-3 text-xs text-primary font-bold mt-2">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 fill-current text-rose-500" /> {confession.likes || 0} likes
                      </span>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {/* ─── TAB 3: NOTIFICATIONS ─── */}
        {activeTab === "activity" && (
          <div className="space-y-3">
            {liveNotifications.length === 0 ? (
              <div className="text-center py-12 text-on-surface-variant neo-inset rounded-2xl bg-surface">
                No recent notifications yet.
              </div>
            ) : (
              liveNotifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-4 rounded-2xl neo-inset bg-surface flex items-center gap-3.5 transition-all"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 shadow-inner">
                    {notif.type === "StoryLiked" ? (
                      <Heart className="w-5 h-5 text-rose-500 fill-current" />
                    ) : (
                      <Sparkles className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface">{notif.title}</p>
                    <p className="text-xs text-on-surface-variant truncate">{notif.body}</p>
                    <p className="text-[10px] text-outline mt-0.5">
                      {new Date(notif.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

