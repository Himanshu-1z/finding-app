import { NavLink } from "react-router-dom";
import { Home, PlusCircle, Bell, User } from "lucide-react";
import { useConnectionRequests, useChats } from "../store/AppContext";

export function BottomNav() {
  const requests = useConnectionRequests();
  const chats = useChats();
  
  const pendingCount = requests.filter(r => r.status === "pending").length;
  const unreadCount = chats.filter((c: any) => c.unread).length;

  return (
    <nav className="md:hidden flex justify-around items-center h-20 px-4 pb-safe bg-surface/90 backdrop-blur-2xl fixed bottom-0 w-full z-50 rounded-t-xl shadow-[0_-4px_20px_rgba(0,0,0,0.05)] neo-inset border-t-0">
      <NavLink
        to="/feed"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center w-16 transition-colors duration-150 ${
            isActive ? "text-primary" : "text-on-surface-variant hover:text-primary"
          }`
        }
      >
        <Home className="mb-1 w-6 h-6" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Home</span>
      </NavLink>

      <NavLink
        to="/chats"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center w-16 transition-colors duration-150 ${
            isActive ? "text-primary" : "text-on-surface-variant hover:text-primary"
          }`
        }
      >
        <div className="relative mb-1 flex items-center justify-center w-7 h-7">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M20 4H4C2.9 4 2 4.9 2 6V15C2 16.1 2.9 17 4 17H7V21L11.5 17H20C21.1 17 22 16.1 22 15V6C22 4.9 21.1 4 20 4Z"
              fill="currentColor"
              fillOpacity="0.12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-600 rounded-full ring-2 ring-surface animate-pulse" />
          )}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest">CHAT</span>
      </NavLink>

      <NavLink
        to="/create"
        className="flex flex-col items-center justify-center w-16 -mt-6 relative transition-colors duration-150"
      >
        <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-on-primary shadow-lg active:scale-95 transition-transform">
          <PlusCircle className="w-6 h-6" />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest mt-1 text-on-surface-variant">Post</span>
      </NavLink>

      <NavLink
        to="/activity"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center w-16 transition-colors duration-150 ${
            isActive ? "text-primary" : "text-on-surface-variant hover:text-primary"
          }`
        }
      >
        <div className="relative mb-1 flex items-center justify-center w-7 h-7">
          <Bell className="w-6 h-6" />
          {pendingCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-error rounded-full ring-2 ring-surface animate-pulse" />
          )}
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest">Alerts</span>
      </NavLink>

      <NavLink
        to="/profile"
        className={({ isActive }) =>
          `flex flex-col items-center justify-center w-16 transition-colors duration-150 ${
            isActive ? "text-primary bg-primary-fixed/30 rounded-full p-2" : "text-on-surface-variant hover:text-primary"
          }`
        }
      >
        <User className="mb-1 w-6 h-6" />
        <span className="text-[10px] font-bold uppercase tracking-widest">Me</span>
      </NavLink>
    </nav>
  );
}
