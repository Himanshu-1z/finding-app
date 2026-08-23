const API_BASE_URL = import.meta.env.VITE_API_URL || (typeof window !== "undefined" ? `http://${window.location.hostname || "localhost"}:5000/api` : "http://localhost:5000/api");


export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

type LoadingListener = (isLoading: boolean) => void;
const loadingListeners = new Set<LoadingListener>();
let activeRequestsCount = 0;

export const subscribeToLoading = (listener: LoadingListener) => {
  loadingListeners.add(listener);
  listener(activeRequestsCount > 0);
  return () => {
    loadingListeners.delete(listener);
  };
};

export const incrementLoading = () => {
  activeRequestsCount++;
  notifyLoading();
};

export const decrementLoading = () => {
  activeRequestsCount = Math.max(0, activeRequestsCount - 1);
  notifyLoading();
};

const notifyLoading = () => {
  const isLoading = activeRequestsCount > 0;
  loadingListeners.forEach((fn) => {
    try {
      fn(isLoading);
    } catch (_) {}
  });
};

export const getAuthToken = (): string | null => {

  const token = localStorage.getItem("accessToken");
  if (token && (token.includes("dummy_token") || !token.includes("."))) {
    localStorage.removeItem("accessToken");
    return null;
  }
  return token;
};

export const setAuthToken = (token: string) => {
  localStorage.setItem("accessToken", token);
};

export const clearAuthToken = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
};

// Track in-flight requests to prevent duplicates
const inFlightRequests = new Map<string, Promise<any>>();

export interface ApiFetchOptions extends RequestInit {
  silent?: boolean;
}

export const apiFetch = async <T = any>(
  endpoint: string,
  options: ApiFetchOptions = {}
): Promise<T> => {
  const method = (options.method || "GET").toUpperCase();
  const isMutation = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
  const isSilent = Boolean(options.silent);

  // Deduplicate: if an identical mutation is already in flight, don't send again
  const requestKey = `${method}:${endpoint}:${options.body || ""}`;
  if (isMutation && inFlightRequests.has(requestKey)) {
    return inFlightRequests.get(requestKey) as Promise<T>;
  }

  if (!isSilent) {
    incrementLoading();
  }

  const doFetch = async (): Promise<T> => {
    try {
      let token = getAuthToken();

      // Only auto-create guest token for READ requests, never for mutations
      if (!token && !isMutation && !endpoint.includes("/auth/")) {
        try {
          const guestPayload = {
            mysteryName: "AnonUser_" + Math.floor(Math.random() * 9000 + 1000),
            email: `guest_${Date.now()}@finding.app`,
            password: "Password123",
            gender: "Male",
            dateOfBirth: "2002-01-15"
          };
          const authRes = await fetch(`${API_BASE_URL}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(guestPayload)
          });
          if (authRes.ok) {
            const data = await authRes.json();
            if (data.accessToken) {
              setAuthToken(data.accessToken);
              token = data.accessToken;
            }
          }
        } catch (_) {}
      }

      const { silent: _s, ...fetchOptions } = options;
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(fetchOptions.headers as Record<string, string>),
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
      });

      if (!response.ok) {
        let errorMsg = `Error ${response.status}: ${response.statusText}`;
        try {
          const errData = await response.json();
          if (errData.error) errorMsg = errData.error;
        } catch (_) {}
        throw new Error(errorMsg);
      }

      return await response.json();
    } finally {
      if (!isSilent) {
        decrementLoading();
      }
      if (isMutation) {
        inFlightRequests.delete(requestKey);
      }
    }
  };

  const promise = doFetch();
  if (isMutation) {
    inFlightRequests.set(requestKey, promise);
  }
  return promise;
};



export const authService = {
  register: async (payload: any) => {
    const res = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
    if (res.accessToken) {
      setAuthToken(res.accessToken);
      localStorage.setItem("user", JSON.stringify(res.user));
    }
    return res;
  },

  login: async (email: string, password: string) => {
    const res = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (res.accessToken) {
      setAuthToken(res.accessToken);
      localStorage.setItem("user", JSON.stringify(res.user));
    }
    return res;
  },

  logout: () => {
    clearAuthToken();
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },
};

export const confessionService = {
  getFeed: async (page = 1, pageSize = 20) => {
    return apiFetch(`/confession/feed?page=${page}&pageSize=${pageSize}`);
  },

  getTargetedConfessions: async () => {
    return apiFetch("/confession/targeted");
  },

  createConfession: async (
    content: string,
    type: 1 | 2,
    targetRealName?: string,
    college?: string,
    branch?: string,
    semester?: string,
    authorMysteryName?: string,
    authorRealName?: string
  ) => {
    const user = authService.getCurrentUser();
    return apiFetch("/confession", {
      method: "POST",
      body: JSON.stringify({
        content,
        isAnonymous: true,
        targetPerson: targetRealName || null,
        type: type === 2 ? "tagged" : "public",
        college: college || user?.college || "Arya (MAIN), kukas",
        branch: branch || user?.branch || "CS",
        semester: semester || user?.semester || "1",
        authorMysteryName: authorMysteryName || user?.secretName || user?.name || "",
        authorRealName: authorRealName || user?.name || "",
      }),
    });
  },


  likeConfession: async (id: string) => {
    return apiFetch(`/confession/${id}/like`, { method: "POST" });
  },

  getMyConfessions: async () => {
    return apiFetch("/confession/my");
  },

  getUserConfessions: async (userId: string) => {
    return apiFetch(`/confession/user/${userId}`);
  },
};


export const interactionService = {
  getMyRequests: async () => {
    return apiFetch("/interaction/my");
  },

  respondToConfession: async (confessionId: string, response: 2 | 3 | 4) => {
    // 2=Liked, 3=InteractRequested, 4=Ignored
    return apiFetch("/interaction/respond", {
      method: "POST",
      body: JSON.stringify({ confessionId, response }),
    });
  },

  confessorAction: async (interactionRequestId: string, action: 2 | 3) => {
    // 2=Accepted, 3=Declined
    return apiFetch("/interaction/confessor-action", {
      method: "POST",
      body: JSON.stringify({ interactionRequestId, action }),
    });
  },
};

import * as signalR from "@microsoft/signalr";

export const chatService = {
  getMyChatRooms: async (silent = false) => {
    return apiFetch("/chatroom", { silent });
  },

  getMessages: async (chatRoomId: string, page = 1, silent = false) => {
    return apiFetch(`/chatroom/${chatRoomId}/messages?page=${page}`, { silent });
  },

  sendMessage: async (chatRoomId: string, content: string, silent = true) => {
    return apiFetch(`/chatroom/${chatRoomId}/messages`, {
      method: "POST",
      body: JSON.stringify({ content }),
      silent,
    });
  },
};

export const paymentService = {
  initiate: async (chatRoomId: string) => {
    return apiFetch("/payment/initiate", {
      method: "POST",
      body: JSON.stringify({ chatRoomId }),
    });
  },

  confirm: async (paymentId: string, transactionRef: string) => {
    return apiFetch("/payment/confirm", {
      method: "POST",
      body: JSON.stringify({ paymentId, transactionRef }),
    });
  },
};

const HUB_URL = API_BASE_URL.replace("/api", "") + "/hubs/chat";

class RealtimeChatClient {
  private connection: signalR.HubConnection | null = null;
  private activeRoomId: string | null = null;

  public async connect(
    chatRoomId: string,
    onMessage: (msg: any) => void,
    onTyping?: (data: { isTyping: boolean; senderName: string; senderId: string; chatRoomId: string }) => void
  ) {
    try {
      if (this.connection) {
        if (this.activeRoomId === chatRoomId && this.connection.state === signalR.HubConnectionState.Connected) {
          return this.connection;
        }
        await this.disconnect();
      }

      const token = getAuthToken();
      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL, {
          accessTokenFactory: () => token || "",
          transport: signalR.HttpTransportType.WebSockets | signalR.HttpTransportType.LongPolling,
          skipNegotiation: false
        })
        .withAutomaticReconnect([0, 1500, 3000, 5000])
        .configureLogging(signalR.LogLevel.None)
        .build();

      this.connection.on("ReceiveMessage", (data: any) => {
        if (onMessage) onMessage(data);
      });

      this.connection.on("UserTyping", (data: any) => {
        if (onTyping) onTyping(data);
      });

      await this.connection.start();
      this.activeRoomId = chatRoomId;
      await this.connection.invoke("JoinRoom", chatRoomId);
      return this.connection;
    } catch (err) {
      console.warn("SignalR Realtime notice:", err);
      return null;
    }
  }

  public async sendTyping(chatRoomId: string, senderId: string, senderName: string, isTyping: boolean) {
    if (this.connection && this.connection.state === signalR.HubConnectionState.Connected) {
      try {
        await this.connection.invoke("SendTyping", chatRoomId, senderId, senderName, isTyping);
      } catch (_) {}
    }
  }

  public async disconnect() {
    if (this.connection) {
      try {
        if (this.activeRoomId && this.connection.state === signalR.HubConnectionState.Connected) {
          await this.connection.invoke("LeaveRoom", this.activeRoomId);
        }
        await this.connection.stop();
      } catch (_) {}
      this.connection = null;
      this.activeRoomId = null;
    }
  }
}

export const realtimeChat = new RealtimeChatClient();

