import React, { createContext, useContext, useReducer, useEffect, ReactNode } from "react";

export interface UserProfile {
  secretName: string;
  gender: "male" | "female" | "";
  name: string;
  college?: string;
  semester: string;
  branch?: string;
  section?: string;
  dob: string;
  mobile: string;
  email: string;
  bio?: string;
  password?: string;
  capturedIdImage: string | null;
  isSetupComplete: boolean;
  interests?: string[];
  avatarMemeGif?: string;
}

export interface Confession {
  id: string;
  author: string;
  time: string;
  content: string;
  likes: number;
  likedByMe: boolean;
  isRequested: boolean;
  type: "public" | "tagged";
  targetPerson?: string;
  targetCollege?: string;
  targetSemester?: string;
  authorCollege?: string;
  authorBranch?: string;
  authorYear?: string;
  isMine?: boolean;
}


export interface ConnectionRequest {
  id: string;
  fromUser: string;
  avatarUrl?: string;
  status: "pending" | "accepted" | "declined";
  confessionContent?: string;
  confessionId?: string;
  createdAt?: string;
  chatRoomId?: string;
}

export interface ChatMessage {
  id: number | string;
  sender: "me" | "them";
  text?: string;
  image?: string;
  fileName?: string;
  fileSize?: string;
  time: string;
}

export interface ChatThread {
  id: string;
  name: string;
  letter: string;
  status: string;
  lastMessage: string;
  time: string;
  unread: boolean;
  messages: ChatMessage[];
  partnerId?: string;
  partnerName?: string;
  createdAt?: string;
}

export interface AppState {
  user: UserProfile | null;
  confessions: Confession[];
  connectionRequests: ConnectionRequest[];
  chats: ChatThread[];
}

export type AppAction =
  | { type: "SET_USER_FIELD"; field: keyof UserProfile; value: any }
  | { type: "COMPLETE_SETUP" }
  | { type: "ADD_CONFESSION"; confession: Confession }
  | { type: "SET_CONFESSIONS"; confessions: Confession[] }
  | { type: "TOGGLE_LIKE"; id: string }
  | { type: "UPDATE_CONFESSION_LIKES"; id: string; likes: number; likedByMe?: boolean }
  | { type: "TOGGLE_REQUEST"; id: string }
  | { type: "SET_CONNECTION_REQUESTS"; requests: ConnectionRequest[] }
  | { type: "ACCEPT_CONNECTION"; id: string; chatRoomId?: string }
  | { type: "DECLINE_CONNECTION"; id: string }
  | { type: "SET_CHATS"; chats: ChatThread[] }
  | { type: "SEND_MESSAGE"; chatId: string; message: ChatMessage }
  | { type: "MARK_CHAT_READ"; chatId: string }
  | { type: "LOGIN_SUCCESS"; user: Partial<UserProfile> }
  | { type: "LOGOUT" };

const initialState: AppState = {
  user: null,
  confessions: [],
  connectionRequests: [],
  chats: []
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_USER_FIELD": {
      const user = state.user || {
        secretName: "",
        gender: "",
        name: "",
        college: "",
        semester: "",
        dob: "",
        mobile: "",
        email: "",
        capturedIdImage: null,
        isSetupComplete: false
      };
      return { ...state, user: { ...user, [action.field]: action.value } as UserProfile };
    }
    case "COMPLETE_SETUP": {
      if (!state.user) return state;
      return { ...state, user: { ...state.user, isSetupComplete: true } };
    }
    case "ADD_CONFESSION": {
      // Upsert: if a confession with same ID already exists, skip (prevents duplicate from optimistic + API load)
      const alreadyExists = state.confessions.some(c => c.id === action.confession.id);
      if (alreadyExists) return state;
      return { ...state, confessions: [action.confession, ...state.confessions] };
    }
    case "SET_CONFESSIONS": {
      // Replace entire feed from API — merge with any local-only "Just now" items that aren't in API yet
      const apiIds = new Set(action.confessions.map(c => c.id));
      const localOnly = state.confessions.filter(c => !apiIds.has(c.id) && c.time === "Just now");
      
      const locallyRequestedIds = new Set(
        state.confessions.filter(c => c.isRequested).map(c => c.id)
      );
      const declinedConfessionIds = new Set(
        state.connectionRequests
          .filter(r => r.status === "declined" || (r as any).status === "rejected")
          .map(r => r.confessionId || r.id)
      );

      const userSecret = (state.user?.secretName || "").toLowerCase();
      const userReal = (state.user?.name || "").toLowerCase();

      const merged = action.confessions.map(c => {
        const isLocallyRequested = locallyRequestedIds.has(c.id);
        const isDeclined = declinedConfessionIds.has(c.id);
        const authorLower = (c.author || "").toLowerCase();
        const isMine = Boolean(
          c.isMine ||
          (userSecret && authorLower === userSecret) ||
          (userReal && authorLower === userReal)
        );

        return {
          ...c,
          isMine,
          isRequested: !isDeclined && (c.isRequested || isLocallyRequested)
        };
      });

      return { ...state, confessions: [...localOnly, ...merged] };
    }

    case "TOGGLE_LIKE": {
      return {
        ...state,
        confessions: state.confessions.map((c) => {
          if (c.id === action.id) {
            const likedByMe = !c.likedByMe;
            return { ...c, likedByMe, likes: Math.max(0, c.likes + (likedByMe ? 1 : -1)) };
          }
          return c;
        })
      };
    }
    case "UPDATE_CONFESSION_LIKES": {
      return {
        ...state,
        confessions: state.confessions.map((c) => {
          if (c.id === action.id) {
            return {
              ...c,
              likes: action.likes,
              likedByMe: action.likedByMe !== undefined ? action.likedByMe : c.likedByMe,
            };
          }
          return c;
        }),
      };
    }
    case "TOGGLE_REQUEST": {
      return {
        ...state,
        confessions: state.confessions.map((c) => {
          if (c.id === action.id) {
            return { ...c, isRequested: !c.isRequested };
          }
          return c;
        })
      };
    }
    case "SET_CONNECTION_REQUESTS": {
      return { ...state, connectionRequests: action.requests };
    }
    case "ACCEPT_CONNECTION": {
      return {
        ...state,
        connectionRequests: state.connectionRequests.map((r) => {
          if (r.id === action.id) return { ...r, status: "accepted", chatRoomId: action.chatRoomId || r.chatRoomId };
          return r;
        })
      };
    }
    case "DECLINE_CONNECTION": {
      return {
        ...state,
        connectionRequests: state.connectionRequests.map((r) => {
          if (r.id === action.id) return { ...r, status: "declined" };
          return r;
        })
      };
    }
    case "SET_CHATS": {
      return { ...state, chats: action.chats };
    }
    case "SEND_MESSAGE": {
      const chatExists = state.chats.some(c => c.id === action.chatId);
      if (!chatExists) {
        const newChat: ChatThread = {
          id: action.chatId,
          name: "Anonymous",
          letter: "A",
          status: "Online",
          lastMessage: action.message.text || "New message",
          time: action.message.time,
          unread: false,
          messages: [action.message]
        };
        return { ...state, chats: [newChat, ...state.chats] };
      }
      return {
        ...state,
        chats: state.chats.map((c) => {
          if (c.id === action.chatId) {
            return {
              ...c,
              lastMessage: action.message.text || (action.message.image ? "Image attached" : "File attached"),
              time: action.message.time,
              messages: [...c.messages, action.message]
            };
          }
          return c;
        })
      };
    }
    case "MARK_CHAT_READ": {
      return {
        ...state,
        chats: state.chats.map((c) => {
          if (c.id === action.chatId) {
            return { ...c, unread: false };
          }
          return c;
        })
      };
    }
    case "LOGIN_SUCCESS": {
      return {
        ...state,
        user: {
          secretName: action.user.secretName || "Storyteller",
          gender: (action.user.gender as any) || "male",
          name: action.user.name || "",
          college: action.user.college || "",
          semester: action.user.semester || "1",
          branch: action.user.branch || "",
          section: action.user.section || "",
          dob: action.user.dob || "",
          mobile: action.user.mobile || "",
          email: action.user.email || "",
          capturedIdImage: action.user.capturedIdImage || null,
          isSetupComplete: true
        }
      };
    }
    case "LOGOUT": {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      // Clear all versioned state keys
      Object.keys(localStorage).forEach(k => {
        if (k.startsWith("finding_app_state")) localStorage.removeItem(k);
      });
      return initialState;
    }


    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | undefined>(undefined);

const STATE_VERSION = "v2"; // bump this to clear stale cached state
const STATE_KEY = `finding_app_state_${STATE_VERSION}`;

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState, (initial) => {
    // Clear old versioned keys on upgrade
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith("finding_app_state") && k !== STATE_KEY) {
        localStorage.removeItem(k);
      }
    });
    const persisted = localStorage.getItem(STATE_KEY);
    if (persisted) {
      try {
        return JSON.parse(persisted);
      } catch (e) {
        console.error("Failed to parse app state", e);
      }
    }
    return initial;
  });

  useEffect(() => {
    localStorage.setItem(STATE_KEY, JSON.stringify(state));
  }, [state]);

  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>;
}


export function useAppStore() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppStore must be used within an AppProvider");
  }
  return context;
}

export function useUser() {
  return useAppStore().state.user;
}

export function useConfessions() {
  return useAppStore().state.confessions;
}

export function useConnectionRequests() {
  return useAppStore().state.connectionRequests;
}

export function useChats() {
  return useAppStore().state.chats;
}
