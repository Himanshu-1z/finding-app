import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";
import { Bell } from "lucide-react";
import { Logo } from "./Logo";
import { useConnectionRequests } from "../store/AppContext";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const requests = useConnectionRequests();
  const hideNavs = ["/", "/setup/1", "/setup/2", "/setup/3"].includes(location.pathname) || location.pathname.startsWith("/chat/");

  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <div className={`bg-surface text-on-surface min-h-screen flex flex-col md:flex-row ${!hideNavs ? "pb-24 md:pb-0" : ""} font-sans relative overflow-x-hidden`}>
      {!hideNavs && <Sidebar />}

      {/* TopAppBar for Mobile */}
      {!hideNavs && (
        <header className="sticky top-0 w-full z-50 bg-surface/80 backdrop-blur-xl flex justify-between items-center px-6 py-2 md:hidden border-b border-outline-variant shadow-sm">
          <button
            onClick={() => navigate("/activity")}
            className="hover:opacity-80 transition-opacity active:scale-95 duration-200 cursor-pointer flex items-center justify-center"
          >
            <Logo className="w-8 h-8" />
          </button>
          <span className="text-3xl font-logo tracking-wide text-primary drop-shadow-sm pb-1">Finding</span>
          <button
            onClick={() => navigate("/activity")}
            className="text-primary hover:opacity-80 transition-opacity active:scale-95 duration-200 relative cursor-pointer"
          >
            <Bell className="w-6 h-6" />
            {pendingCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-error rounded-full ring-2 ring-surface animate-pulse" />
            )}
          </button>
        </header>
      )}

      <main
        className={`flex-1 w-full max-w-4xl mx-auto flex flex-col relative z-10 ${
          !hideNavs ? "px-4 sm:px-6 md:px-8 py-6 md:ml-80" : "p-0"
        }`}
      >
        <Outlet />
      </main>

      {!hideNavs && <BottomNav />}
    </div>
  );
}
