import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import { api } from '../services/api';
import {
  LayoutDashboard, Users, MessageSquare, ShieldAlert,
  Settings, LogOut, MessageCircleHeart, UserCog, FileSearch, Clock
} from 'lucide-react';

export default function Layout() {
  const { logout, role, adminName, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState<string>(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    const loadCounts = () => {
      api.getStats().then(s => setStats(s)).catch(() => {});
    };
    loadCounts();
    const interval = setInterval(loadCounts, 5000);

    return () => {
      clearInterval(timer);
      clearInterval(interval);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  // Admin navigation items with live badges
  const navItems = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/users', icon: Users, label: 'Users', badge: stats?.totalUsers },
    { to: '/admin/confessions', icon: MessageSquare, label: 'Confessions', badge: stats?.confessionsToday },
    { to: '/admin/requests', icon: ShieldAlert, label: 'Reports & Requests', badge: stats?.openReports, badgeColor: 'bg-rose-500 text-white' },
    { to: '/admin/chats', icon: MessageCircleHeart, label: 'Chats' },
    { to: '/admin/verifications', icon: FileSearch, label: 'Verifications', badge: stats?.pendingVerifications, badgeColor: 'bg-amber-500 text-white' },
    // Super Admin only
    ...(isSuperAdmin ? [
      { to: '/admin/staff', icon: UserCog, label: 'Staff Management' },
      { to: '/admin/settings', icon: Settings, label: 'Settings' },
    ] : []),
  ];

  const roleColor = isSuperAdmin ? 'text-amber-500' : 'text-[var(--color-primary)]';
  const roleBg = isSuperAdmin ? 'bg-amber-500/10 border-amber-500/30' : 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]/30';
  const roleEmoji = isSuperAdmin ? '👑' : '🛡';

  return (
    <div className="flex flex-col h-screen bg-[var(--color-background)] text-[var(--color-on-background)] p-6 sm:p-8 overflow-hidden select-none">
      {/* Header */}
      <header className="flex justify-between items-center mb-6 pb-4 border-b border-outline-variant/30">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 neo-outset rounded-2xl flex items-center justify-center bg-surface border border-white/40 shadow-xs">
            <span className="font-logo text-2xl text-[var(--color-primary)] font-bold">F</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-logo text-3xl text-[var(--color-primary)] tracking-tight">Finding</h1>
              <span className="text-xs font-bold tracking-widest uppercase px-2.5 py-0.5 rounded-md bg-surface-container neo-inset text-on-surface-variant">
                Control Hub
              </span>
            </div>
            <div className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] font-bold tracking-widest uppercase mt-0.5 ${roleBg} ${roleColor}`}>
              {roleEmoji} <span>{role}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Real-time Clock */}
          <div className="neo-inset px-4 py-2 hidden md:flex items-center gap-2 rounded-xl text-xs font-mono font-bold text-on-surface-variant bg-surface-container">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span>{currentTime}</span>
          </div>

          <div className="neo-inset px-4 py-2 flex items-center gap-2.5 rounded-xl bg-surface-container">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-xs"></div>
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-tighter">System Online</span>
          </div>

          <div className="neo-button px-4 py-2 flex items-center gap-3 bg-surface rounded-2xl">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-xs ${isSuperAdmin ? 'bg-amber-500/20 text-amber-600 border border-amber-300' : 'bg-[var(--color-primary-fixed)] text-[var(--color-primary)]'}`}>
              {adminName.slice(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-sm font-bold text-on-surface leading-tight">{adminName}</span>
              <span className={`text-[10px] font-bold ${roleColor}`}>{role}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 gap-6 min-h-0">
        {/* Navigation Sidebar */}
        <nav className="w-64 flex flex-col gap-3 shrink-0">
          <div className="neo-outset p-2.5 flex flex-col gap-1.5 flex-1 rounded-3xl bg-surface">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-3 rounded-2xl font-semibold text-xs tracking-wide transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[var(--color-primary)] text-white shadow-md font-bold'
                      : 'hover:bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]'
                  }`
                }
              >
                <div className="flex items-center gap-3">
                  <item.icon className="w-4.5 h-4.5 shrink-0" />
                  <span>{item.label}</span>
                </div>

                {typeof item.badge === 'number' && item.badge > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${item.badgeColor || 'bg-surface-container-high text-on-surface border border-outline-variant/40'}`}>
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </div>

          <div className="neo-outset p-4 text-center rounded-3xl bg-surface">
            <p className="text-[10px] uppercase tracking-widest text-[var(--color-on-surface-variant)] mb-2 font-bold opacity-70">
              Admin Platform v2.2.0
            </p>
            <button
              onClick={handleLogout}
              className="neo-button w-full py-2.5 text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center justify-center gap-2 rounded-xl cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout Console</span>
            </button>
          </div>
        </nav>

        {/* Main Content Viewport */}
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-1">
          <Outlet />
        </main>
      </div>

      <footer className="mt-4 pt-3 border-t border-outline-variant/30 flex justify-between items-center opacity-70 text-xs">
        <div className="flex gap-4">
          <span>&copy; 2026 Finding Inc.</span>
          <span>Security Layer: <strong>Encrypted</strong></span>
        </div>
        <div className="font-mono font-bold tracking-wider uppercase text-emerald-600">
          ● Supabase Cluster Connected
        </div>
      </footer>
    </div>
  );
}
