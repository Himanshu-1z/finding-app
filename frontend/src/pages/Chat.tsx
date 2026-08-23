import React, { useState, useRef, ChangeEvent, useEffect } from "react";
import {
  ArrowLeft,
  MoreVertical,
  Lock,
  CheckCheck,
  Plus,
  Smile,
  Send,
  Image,
  Camera,
  FileText,
  X,
  Paperclip,
} from "lucide-react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { useAppStore, useChats } from "../store/AppContext";
import { chatService, realtimeChat, apiFetch } from "../services/apiClient";

export function Chat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: chatId } = useParams();
  const { state, dispatch } = useAppStore();
  const chats = useChats();

  const [partnerName, setPartnerName] = useState<string>(location.state?.name || location.state?.partnerName || "");
  const [partnerStatus, setPartnerStatus] = useState<string>(location.state?.status || "Online");
  const partnerLetter = partnerName ? partnerName.charAt(0).toUpperCase() : "A";

  const [messageText, setMessageText] = useState("");
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);

  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const typingTimeoutRef = useRef<any>(null);
  const myTypingDebounceRef = useRef<any>(null);

  const [messages, setMessages] = useState<
    Array<{
      id: number | string;
      sender: string;
      text?: string;
      image?: string;
      fileName?: string;
      fileSize?: string;
      time: string;
    }>
  >(chats.find(c => c.id === chatId)?.messages ?? []);

  // Fetch chatroom metadata (partner name) if missing
  useEffect(() => {
    if (!chatId) return;
    apiFetch(`/chatroom/${chatId}`)
      .then((room: any) => {
        if (room && (room.partnerName || room.name)) {
          setPartnerName(room.partnerName || room.name);
          if (room.status) setPartnerStatus(room.status);
        }
      })
      .catch(() => {});
  }, [chatId]);

  useEffect(() => {
    if (!chatId) return;

    let isMounted = true;

    const mySecret = (state.user?.secretName || "").toLowerCase().trim();
    const myName = (state.user?.name || "").toLowerCase().trim();
    const myUserId = (state.user as any)?.id;

    // Helper to accurately map message sender
    const mapMsgSender = (m: any) => {
      const sName = (m.senderName || "").toLowerCase().trim();
      const isMe =
        m.sender === "me" ||
        (myUserId && m.senderId === myUserId) ||
        (mySecret && sName === mySecret) ||
        (myName && sName === myName);
      return isMe ? "me" : "them";
    };

    // 1. Initial silent load
    chatService.getMessages(chatId, 1, true)
      .then((res: any) => {
        if (isMounted && Array.isArray(res) && res.length > 0) {
          const loaded = res.map((m: any) => ({
            id: m.id || Date.now() + Math.random(),
            sender: mapMsgSender(m),
            text: m.text || m.content || "",
            time: m.time || (m.sentAt ? new Date(m.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Now")
          }));
          setMessages(loaded);
        }
      })
      .catch(err => console.warn("Load messages note:", err));

    // 2. Real-time SignalR WebSocket listener
    realtimeChat.connect(
      chatId,
      (newMsg: any) => {
        if (!isMounted) return;
        setIsPartnerTyping(false);

        // Ignore echo of our own sent messages
        const sName = (newMsg.senderName || "").toLowerCase().trim();
        const isMe =
          newMsg.sender === "me" ||
          (myUserId && newMsg.senderId === myUserId) ||
          (mySecret && sName === mySecret) ||
          (myName && sName === myName);

        if (isMe) return;

        const mappedMsg = {
          id: newMsg.id || Date.now() + Math.random(),
          sender: "them",
          text: newMsg.text || newMsg.content || "",
          time: newMsg.time || new Date(newMsg.sentAt || Date.now()).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };

        setMessages((prev) => {
          if (prev.some((m) => m.id === mappedMsg.id || (m.text === mappedMsg.text && m.sender === "them"))) {
            return prev;
          }
          return [...prev, mappedMsg];
        });
        dispatch({ type: "SEND_MESSAGE", chatId: chatId!, message: mappedMsg as any });
      },
      (typingData: any) => {
        if (!isMounted) return;
        if (typingData.isTyping) {
          setIsPartnerTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            if (isMounted) setIsPartnerTyping(false);
          }, 3000);
        } else {
          setIsPartnerTyping(false);
        }
      }
    );

    // 3. Background sync every 3s
    const interval = setInterval(() => {
      if (!isMounted) return;
      chatService.getMessages(chatId, 1, true)
        .then((res: any) => {
          if (isMounted && Array.isArray(res) && res.length > 0) {
            const loaded = res.map((m: any) => ({
              id: m.id || Date.now() + Math.random(),
              sender: mapMsgSender(m),
              text: m.text || m.content || "",
              time: m.time || (m.sentAt ? new Date(m.sentAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Now")
            }));
            setMessages(loaded);
          }
        })
        .catch(() => {});
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      if (myTypingDebounceRef.current) clearTimeout(myTypingDebounceRef.current);
      realtimeChat.disconnect();
    };
  }, [chatId, state.user]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isPartnerTyping]);

  const getTimeStr = () => {
    const now = new Date();
    return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMessageText(val);

    if (chatId) {
      const myName = state.user?.secretName || state.user?.name || "Me";
      realtimeChat.sendTyping(chatId, "me", myName, true);
      if (myTypingDebounceRef.current) clearTimeout(myTypingDebounceRef.current);
      myTypingDebounceRef.current = setTimeout(() => {
        realtimeChat.sendTyping(chatId, "me", myName, false);
      }, 1500);
    }
  };

  const handleSendMessage = (textToSend?: string) => {
    const text = textToSend ?? messageText;
    if (!text.trim()) return;
    
    if (chatId) {
      const myName = state.user?.secretName || state.user?.name || "Me";
      realtimeChat.sendTyping(chatId, "me", myName, false);
    }

    const tempId = Date.now();
    const newMsg = {
      id: tempId,
      sender: "me",
      text: text.trim(),
      time: getTimeStr(),
    };
    
    setMessages((prev) => [...prev, newMsg]);
    dispatch({ type: "SEND_MESSAGE", chatId: chatId!, message: newMsg as any });
    
    if (!textToSend) setMessageText("");

    if (chatId) {
      chatService.sendMessage(chatId, text.trim(), true)
        .then((res: any) => {
          if (res && res.id) {
            setMessages((prev) =>
              prev.map((m) => (m.id === tempId ? { ...m, id: res.id } : m))
            );
          }
        })
        .catch(err => console.warn("Live send message notice:", err));
    }
  };

  // Handle Photo selection from gallery
  const handlePhotoSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        const newMsg = {
          id: Date.now(),
          sender: "me",
          image: result,
          text: file.name,
          time: getTimeStr(),
        };
        setMessages((prev) => [...prev, newMsg]);
        dispatch({ type: "SEND_MESSAGE", chatId: chatId!, message: newMsg as any });
      };
      reader.readAsDataURL(file);
    }
    setShowAttachMenu(false);
    if (e.target) e.target.value = "";
  };

  // Handle Generic File selection
  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith("image/")) {
        handlePhotoSelect(e);
        return;
      }
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2) + " MB";
      const newMsg = {
        id: Date.now(),
        sender: "me",
        fileName: file.name,
        fileSize: sizeInMB,
        time: getTimeStr(),
      };
      setMessages((prev) => [...prev, newMsg]);
      dispatch({ type: "SEND_MESSAGE", chatId: chatId!, message: newMsg as any });
    }
    setShowAttachMenu(false);
    if (e.target) e.target.value = "";
  };

  // Open live camera modal or trigger native camera
  const startCamera = async () => {
    setShowAttachMenu(false);
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
        });
        setCameraStream(stream);
        setShowCameraModal(true);
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }, 100);
      } else {
        cameraInputRef.current?.click();
      }
    } catch {
      // Fallback to native camera input
      cameraInputRef.current?.click();
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg");
        const newMsg = {
          id: Date.now(),
          sender: "me",
          image: dataUrl,
          text: "Captured photo",
          time: getTimeStr(),
        };
        setMessages((prev) => [...prev, newMsg]);
        dispatch({ type: "SEND_MESSAGE", chatId: chatId!, message: newMsg as any });
      }
    }
    stopCamera();
  };

  return (
    <div className="flex flex-col h-screen max-h-screen w-full relative overflow-hidden bg-surface">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={photoInputRef}
        accept="image/*"
        className="hidden"
        onChange={handlePhotoSelect}
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handlePhotoSelect}
      />
      <input
        type="file"
        ref={fileInputRef}
        accept="*"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Live Camera Modal */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-between p-4">
          <div className="w-full flex justify-between items-center text-white pt-2">
            <span className="font-bold text-sm tracking-wider uppercase">Camera Viewfinder</span>
            <button
              onClick={stopCamera}
              className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="relative w-full max-w-md aspect-[3/4] bg-black rounded-2xl overflow-hidden shadow-2xl my-auto flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          </div>

          <div className="w-full max-w-md flex justify-center pb-6">
            <button
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full bg-white border-4 border-primary p-1 flex items-center justify-center active:scale-90 transition-transform cursor-pointer shadow-lg"
            >
              <div className="w-full h-full rounded-full bg-primary" />
            </button>
          </div>
        </div>
      )}

      <header className="bg-surface/90 backdrop-blur-xl sticky top-0 w-full z-50 border-b border-white/10 shadow-xs flex justify-between items-center px-4 sm:px-6 py-2 h-16 shrink-0">
        <button
          onClick={() => navigate("/chats")}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant active:scale-95 duration-200 cursor-pointer"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-3">
          <div
            className="relative w-10 h-10 rounded-full glass-blob flex items-center justify-center border border-white/40 shadow-xs overflow-hidden shrink-0"
            style={{
              borderRadius: "40% 60% 70% 30% / 40% 50% 60% 50%",
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary-fixed to-surface-tint opacity-50" />
            <span className="font-bold text-sm text-on-primary-container z-10">
              {partnerLetter}
            </span>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-surface z-20" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-primary tracking-tighter">{partnerName}</h1>
            <span className={`text-[10px] font-bold uppercase tracking-widest ${isPartnerTyping ? "text-primary animate-pulse" : "text-on-surface-variant/70"}`}>
              {isPartnerTyping ? "typing..." : partnerStatus}
            </span>
          </div>
        </div>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-high transition-colors text-on-surface-variant active:scale-95 duration-200 cursor-pointer">
          <MoreVertical className="w-6 h-6" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden hide-scrollbar flex flex-col px-4 py-4 gap-4 relative">
        <div className="w-full max-w-md mx-auto mb-1 p-3.5 rounded-xl neo-inset bg-surface-container-low text-center">
          <p className="text-xs text-on-surface-variant/80 flex items-center justify-center gap-2">
            <Lock className="w-4 h-4 text-primary" />
            Messages are end-to-end encrypted and self-destruct after 24 hours.
          </p>
        </div>

        <div className="flex justify-center my-1">
          <span className="text-[10px] font-bold uppercase tracking-widest bg-surface-container-high px-4 py-1.5 rounded-full text-on-surface-variant/60 shadow-xs border border-white/50">
            Chat established today, 10:42 AM
          </span>
        </div>

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col gap-1 max-w-[85%] group ${
              msg.sender === "me" ? "self-end items-end" : "self-start items-start"
            }`}
          >
            <div
              className={`${
                msg.sender === "me"
                  ? "bg-primary text-on-primary rounded-[20px] rounded-bl-[4px] shadow-xs"
                  : "neo-inset bg-surface-container rounded-[20px] rounded-br-[4px] text-on-surface"
              } ${msg.image || msg.fileName ? "p-3" : "px-5 py-3.5"} text-base relative`}
            >
              {msg.image && (
                <div className="rounded-lg overflow-hidden mb-1 relative max-w-xs">
                  <img
                    src={msg.image}
                    alt="Shared asset"
                    className="w-full max-h-60 object-cover rounded-lg"
                  />
                </div>
              )}
              {msg.fileName && (
                <div className="flex items-center gap-3 bg-black/10 dark:bg-white/10 p-2.5 rounded-xl mb-1">
                  <div className="w-10 h-10 rounded-lg bg-surface flex items-center justify-center text-primary shrink-0">
                    <Paperclip className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate">{msg.fileName}</p>
                    <p className="text-[11px] opacity-75">{msg.fileSize}</p>
                  </div>
                </div>
              )}
              {msg.text && <p className={msg.image ? "px-1 pt-1" : ""}>{msg.text}</p>}
            </div>
            <div className="flex items-center gap-1 mx-2 opacity-60 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
                {msg.time}
              </span>
              {msg.sender === "me" && <CheckCheck className="w-3.5 h-3.5 text-primary" />}
            </div>
          </div>
        ))}

        {isPartnerTyping && (
          <div className="self-start flex items-center gap-2 neo-inset bg-surface-container rounded-[20px] rounded-br-[4px] px-4 py-3 text-xs text-primary font-medium animate-pulse shadow-xs">
            <span>{partnerName} is typing</span>
            <span className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
            </span>
          </div>
        )}

        <div ref={bottomRef} />
      </main>

      <footer className="bg-surface-container-low/95 backdrop-blur-2xl border-t border-white/30 px-4 py-3 shrink-0 z-40 relative">
        {/* Attach Menu Popup */}
        {showAttachMenu && (
          <div className="absolute bottom-16 left-4 bg-surface neo-outset rounded-2xl p-2 border border-white/40 shadow-xl flex flex-col gap-1 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 min-w-[180px]">
            <button
              type="button"
              onClick={() => {
                setShowAttachMenu(false);
                photoInputRef.current?.click();
              }}
              className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-surface-container-high rounded-xl text-left transition-colors cursor-pointer text-on-surface"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500/15 text-blue-600 flex items-center justify-center shrink-0">
                <Image className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold">Photos</span>
            </button>

            <button
              type="button"
              onClick={startCamera}
              className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-surface-container-high rounded-xl text-left transition-colors cursor-pointer text-on-surface"
            >
              <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                <Camera className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold">Camera</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowAttachMenu(false);
                fileInputRef.current?.click();
              }}
              className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-surface-container-high rounded-xl text-left transition-colors cursor-pointer text-on-surface"
            >
              <div className="w-8 h-8 rounded-full bg-amber-500/15 text-amber-600 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold">Files</span>
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 max-w-3xl mx-auto w-full"
        >
          <button
            type="button"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className={`w-11 h-11 shrink-0 flex items-center justify-center rounded-full bg-surface-container neo-outset transition-all active:scale-95 cursor-pointer ${
              showAttachMenu
                ? "text-primary bg-primary-fixed/30 rotate-45"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <Plus className="w-5 h-5 transition-transform duration-200" />
          </button>

          <div className="flex-1 relative neo-inset bg-surface-container-lowest rounded-2xl overflow-hidden min-h-[46px] flex items-center">
            <button
              type="button"
              className="absolute left-3 w-7 h-7 flex items-center justify-center text-on-surface-variant/60 hover:text-primary transition-colors"
            >
              <Smile className="w-5 h-5" />
            </button>
            <input
              type="text"
              value={messageText}
              onChange={handleInputChange}
              className="w-full bg-transparent border-none focus:ring-0 text-base text-on-surface py-2.5 pl-11 pr-4 outline-none"
              placeholder="Type a story message..."
            />
          </div>

          <button
            type="submit"
            className="w-11 h-11 shrink-0 flex items-center justify-center rounded-[40%_60%_70%_30%/40%_50%_60%_50%] bg-primary text-on-primary shadow-xs hover:opacity-90 transition-opacity active:scale-95 cursor-pointer"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </footer>
    </div>
  );
}


