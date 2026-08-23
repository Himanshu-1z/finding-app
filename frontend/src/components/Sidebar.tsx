import { NavLink } from "react-router-dom";
import { CircleDot, MessageSquareQuote, PlusSquare, BellRing, Settings } from "lucide-react";
import { useUser, useConnectionRequests, useChats } from "../store/AppContext";
import { Logo } from "./Logo";

export function Sidebar() {
  const user = useUser();
  const requests = useConnectionRequests();
  const chats = useChats();
  
  const pendingCount = requests.filter(r => r.status === "pending").length;
  const unreadCount = chats.filter((c: any) => c.unread).length;

  return (
    <aside className="hidden md:flex flex-col py-6 gap-3 fixed left-0 top-0 h-screen w-80 z-40 bg-surface border-r border-outline-variant">
      <div className="px-6 mb-8 flex items-center gap-3">
        <Logo className="w-10 h-10" />
        <span className="text-4xl font-logo tracking-wide text-primary drop-shadow-sm pb-1">Finding</span>
      </div>
      
      <div className="px-6 mb-8 flex items-center gap-4">
        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-surface-container-high border border-outline-variant neo-outset">
          <img
            src={user?.avatarMemeGif || user?.avatarUrl || `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${user?.secretName || 'Student'}&backgroundColor=c0aede`}
            alt="User Avatar"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.secretName || 'Student'}&backgroundColor=ffd5dc`;
            }}
          />
        </div>
        <div className="overflow-hidden">
          <h3 className="text-lg font-semibold text-primary truncate max-w-[170px]">{user?.secretName || "Storyteller"}</h3>
          <p className="text-xs text-on-surface-variant truncate max-w-[170px]">{user?.name || "Student Member"} • Privacy Active</p>
        </div>
      </div>
      
      <nav className="flex flex-col gap-2 px-4 flex-1">
        <NavLink
          to="/feed"
          className={({ isActive }) =>
            `flex items-center gap-4 p-3 rounded-lg transition-transform hover:translate-x-1 ${
              isActive
                ? "text-primary font-bold border-r-4 border-primary bg-primary-fixed/10"
                : "text-on-surface-variant hover:bg-surface-container-low"
            }`
          }
        >
          <CircleDot className="w-6 h-6" />
          <span className="text-base font-normal">Feed</span>
        </NavLink>

        <NavLink
          to="/chats"
          className={({ isActive }) =>
            `flex items-center gap-4 p-3 rounded-lg transition-transform hover:translate-x-1 ${
              isActive
                ? "text-primary font-bold border-r-4 border-primary bg-primary-fixed/10"
                : "text-on-surface-variant hover:bg-surface-container-low"
            }`
          }
        >
          <div className="relative">
            <MessageSquareQuote className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full ring-2 ring-surface animate-pulse" />
            )}
          </div>
          <span className="text-base font-normal">Recent Chats</span>
        </NavLink>

        <NavLink
          to="/create"
          className={({ isActive }) =>
            `flex items-center gap-4 p-3 rounded-lg transition-transform hover:translate-x-1 ${
              isActive
                ? "text-primary font-bold border-r-4 border-primary bg-primary-fixed/10"
                : "text-on-surface-variant hover:bg-surface-container-low"
            }`
          }
        >
          <PlusSquare className="w-6 h-6" />
          <span className="text-base font-normal">Create</span>
        </NavLink>

        <NavLink
          to="/activity"
          className={({ isActive }) =>
            `flex items-center gap-4 p-3 rounded-lg transition-transform hover:translate-x-1 ${
              isActive
                ? "text-primary font-bold border-r-4 border-primary bg-primary-fixed/10"
                : "text-on-surface-variant hover:bg-surface-container-low"
            }`
          }
        >
          <div className="relative">
            <BellRing className="w-6 h-6" />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full ring-2 ring-surface animate-pulse" />
            )}
          </div>
          <span className="text-base font-normal">Notifications</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) =>
            `flex items-center gap-4 p-3 rounded-lg transition-transform hover:translate-x-1 mt-auto ${
              isActive
                ? "text-primary font-bold border-r-4 border-primary bg-primary-fixed/10"
                : "text-on-surface-variant hover:bg-surface-container-low"
            }`
          }
        >
          <Settings className="w-6 h-6" />
          <span className="text-base font-normal">Profile Settings</span>
        </NavLink>
      </nav>
    </aside>
  );
}
