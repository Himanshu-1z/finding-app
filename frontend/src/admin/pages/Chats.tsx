import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ChatThread } from '../types/models';
import { MessageCircleHeart, MessagesSquare, Sparkles } from 'lucide-react';

export default function Chats() {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);

  useEffect(() => {
    api.getChats()
      .then(res => {
        setThreads(res.threads);
        if (res.threads.length > 0 && !selectedThread) {
          setSelectedThread(res.threads[0]);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4 animate-in fade-in duration-300 h-full flex flex-col min-h-0">
      <header className="flex justify-between items-center shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-[var(--color-primary-fixed)] text-[var(--color-primary)] rounded">
              Super Admin Moderation
            </span>
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-on-background)] mt-0.5">Chat Oversight & Direct Messages</h2>
          <p className="text-[var(--color-on-surface-variant)] font-medium text-xs">Real-time supervision of private student chat rooms and connection channels.</p>
        </div>
      </header>

      {/* Dual Pane Layout filling 100% available height */}
      <div className="flex-1 min-h-0 flex gap-4 overflow-hidden">
        {/* Left Pane: Conversation List */}
        <div className="w-80 md:w-96 flex flex-col h-full min-h-0 neo-outset rounded-3xl overflow-hidden bg-surface shrink-0 shadow-xs">
          <div className="px-4 py-3 border-b border-outline-variant/30 flex justify-between items-center bg-surface shrink-0">
            <h3 className="font-bold text-sm text-on-surface flex items-center gap-2">
              <MessagesSquare className="w-4 h-4 text-primary" /> Active Threads ({threads.length})
            </h3>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
              Live Supabase
            </span>
          </div>

          {loading ? (
            <div className="flex-1 flex items-center justify-center text-on-surface-variant animate-pulse text-xs font-semibold">
              Loading chat threads...
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center text-rose-600 font-bold text-xs p-4 text-center">
              Failed to load: {error}
            </div>
          ) : threads.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant p-6 text-center">
              <MessageCircleHeart className="w-10 h-10 opacity-30 mb-2" />
              <p className="text-xs font-bold">No active conversations found.</p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto p-3 flex flex-col gap-2.5">
              {threads.map(thread => {
                const isSelected = selectedThread?.id === thread.id;
                const user1Name = thread.user1?.name || thread.name.split(" & ")[0] || "User 1";
                const user2Name = thread.user2?.name || thread.name.split(" & ")[1] || "User 2";

                return (
                  <div
                    key={thread.id}
                    onClick={() => setSelectedThread(thread)}
                    className={`p-3 rounded-2xl transition-all cursor-pointer border flex items-start gap-3 select-none ${
                      isSelected
                        ? "bg-primary/10 border-primary/40 shadow-xs"
                        : "bg-surface-container-low hover:bg-surface-container border-transparent"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                      isSelected ? "bg-primary text-white" : "bg-surface-container-high text-primary"
                    }`}>
                      {thread.letter || "💬"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-0.5">
                        <span className="font-bold text-xs text-on-surface truncate">
                          @{user1Name} <span className="opacity-60 text-[10px]">vs</span> @{user2Name}
                        </span>
                        <span className="text-[10px] text-on-surface-variant ml-1 shrink-0">
                          {new Date(thread.time).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <p className="text-xs text-on-surface-variant truncate">
                        {thread.lastMessage || "Conversation opened."}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Pane: Active Conversation Moderation Workspace */}
        <div className="flex-1 min-h-0 flex flex-col h-full neo-outset rounded-3xl overflow-hidden bg-surface shadow-xs">
          {selectedThread ? (
            (() => {
              const user1Name = selectedThread.user1?.name || selectedThread.name.split(" & ")[0] || "User 1";
              const user2Name = selectedThread.user2?.name || selectedThread.name.split(" & ")[1] || "User 2";

              return (
                <>
                  {/* Participant Header */}
                  <div className="px-5 py-3 border-b border-outline-variant/30 flex justify-between items-center bg-surface shrink-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-on-surface">
                          @{user1Name}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          vs
                        </span>
                        <span className="font-bold text-sm text-on-surface">
                          @{user2Name}
                        </span>
                      </div>
                      <p className="text-[10px] text-on-surface-variant font-mono mt-0.5">
                        Thread ID: {selectedThread.id}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      {selectedThread.user1 && (
                        <div className="px-2.5 py-1 rounded-xl bg-purple-500/10 text-purple-800 border border-purple-300 flex items-center gap-1.5 text-xs">
                          <span className="w-2 h-2 rounded-full bg-purple-600" />
                          <span className="font-bold">@{selectedThread.user1.name}</span>
                          {selectedThread.user1.realName && (
                            <span className="opacity-75 text-[10px]">({selectedThread.user1.realName})</span>
                          )}
                        </div>
                      )}
                      {selectedThread.user2 && (
                        <div className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 text-xs">
                          <span className="w-2 h-2 rounded-full bg-emerald-600" />
                          <span className="font-bold">@{selectedThread.user2.name}</span>
                          {selectedThread.user2.realName && (
                            <span className="opacity-75 text-[10px]">({selectedThread.user2.realName})</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Messages Stream (Internally Scrollable) */}
                  <div className="flex-1 min-h-0 overflow-y-auto neo-inset m-3 p-4 flex flex-col gap-3 rounded-2xl bg-surface-container/40">
                    {selectedThread.messages.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant text-xs">
                        <Sparkles className="w-8 h-8 opacity-30 mb-1.5" />
                        <p>No messages recorded in this channel yet.</p>
                      </div>
                    ) : (
                      selectedThread.messages.map((msg) => {
                        const isUser1 = msg.senderName === user1Name || msg.sender === "me";
                        const currentSenderName = msg.senderName || (isUser1 ? user1Name : user2Name);
                        const currentRealName = msg.senderRealName;

                        return (
                          <div
                            key={msg.id}
                            className={`flex flex-col max-w-[75%] ${
                              isUser1 ? "self-start items-start" : "self-end items-end"
                            }`}
                          >
                            {/* Sender Pill */}
                            <div className="flex items-center gap-1.5 mb-1 px-1 text-xs">
                              <span
                                className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${
                                  isUser1
                                    ? "bg-purple-100 text-purple-900 border border-purple-200"
                                    : "bg-emerald-100 text-emerald-900 border border-emerald-200"
                                }`}
                              >
                                @{currentSenderName}
                              </span>
                              {currentRealName && (
                                <span className="text-on-surface-variant text-[10px] font-medium opacity-80">
                                  ({currentRealName})
                                </span>
                              )}
                            </div>

                            {/* Message Bubble */}
                            <div
                              className={`p-3.5 rounded-2xl shadow-xs border text-xs leading-relaxed ${
                                isUser1
                                  ? "bg-surface text-on-surface border-purple-200/80 rounded-tl-xs"
                                  : "bg-primary text-on-primary border-primary/40 rounded-tr-xs"
                              }`}
                            >
                              <p className="text-xs">{msg.text}</p>
                            </div>

                            {/* Time */}
                            <span className="text-[9px] text-on-surface-variant mt-0.5 px-1 font-medium">
                              {new Date(msg.time).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              );
            })()
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant p-8 text-center">
              <MessageCircleHeart className="w-12 h-12 opacity-30 mb-2" />
              <p className="text-sm font-bold">Select a conversation thread on the left to inspect messages.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

