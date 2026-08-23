import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DashboardStats } from '../types/models';
import { Users, FileText, AlertTriangle, UserCheck, MessageSquareQuote, HeartHandshake, ShieldAlert, Sparkles, RefreshCw, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ActivityItem {
  id: string;
  type: 'confession' | 'interaction' | 'user' | 'report';
  title: string;
  actor: string;
  college?: string;
  description: string;
  timestamp: string;
  status?: string;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [statsData, activityData] = await Promise.all([
        api.getStats(),
        api.getActivityLog()
      ]);
      setStats(statsData);
      setActivities(activityData);
    } catch (err: any) {
      setError(err?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      api.getStats().then(s => setStats(s)).catch(() => {});
      api.getActivityLog().then(a => setActivities(a)).catch(() => {});
    }, 3000);
    window.addEventListener("focus", loadData);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", loadData);
    };
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-[var(--color-on-surface-variant)] animate-pulse">Loading live dashboard metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-[var(--color-error-container)] text-[var(--color-on-error-container)] rounded-2xl text-center">
        <p className="font-bold">Failed to load live metrics: {error}</p>
        <button onClick={handleRefresh} className="mt-3 px-4 py-2 bg-primary text-on-primary rounded-xl text-xs font-bold">
          Retry
        </button>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'confession':
        return <MessageSquareQuote className="w-5 h-5 text-indigo-600" />;
      case 'interaction':
        return <HeartHandshake className="w-5 h-5 text-purple-600" />;
      case 'user':
        return <Users className="w-5 h-5 text-emerald-600" />;
      case 'report':
        return <ShieldAlert className="w-5 h-5 text-rose-600" />;
      default:
        return <Sparkles className="w-5 h-5 text-amber-600" />;
    }
  };

  const getActivityBadge = (type: string, status?: string) => {
    if (type === 'confession') {
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">Story</span>;
    }
    if (type === 'interaction') {
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">Interaction</span>;
    }
    if (type === 'user') {
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">User</span>;
    }
    if (type === 'report') {
      return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">Report</span>;
    }
    return null;
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 h-full flex flex-col min-h-0">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-on-background)] tracking-tight">Admin Overview</h2>
          <p className="text-[var(--color-on-surface-variant)] text-xs font-medium mt-0.5">Live campus metrics and real-time student activity feed.</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-3.5 py-2 bg-[var(--color-surface)] hover:bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)] rounded-xl text-xs font-bold text-[var(--color-on-surface)] transition-all active:scale-95 shadow-sm cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-primary ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing...' : 'Refresh Live Feed'}
        </button>
      </div>

      {/* 4 Primary Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
        <Link to="/admin/users" className="neo-outset p-4 bg-[var(--color-surface)] rounded-2xl block hover:border-primary/40 transition-all group">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] uppercase text-[var(--color-on-surface-variant)] font-bold tracking-wider">Total Users</p>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-[var(--color-primary)] group-hover:scale-105 transition-transform origin-left">
            {stats?.totalUsers ?? 0}
          </h3>
          <p className="text-[10px] text-emerald-600 mt-1 font-semibold">Registered Campus Students</p>
        </Link>

        <Link to="/admin/verifications" className="neo-outset p-4 bg-[var(--color-surface)] rounded-2xl block hover:border-primary/40 transition-all group">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] uppercase text-[var(--color-on-surface-variant)] font-bold tracking-wider">Pending IDs</p>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-[var(--color-primary)] group-hover:scale-105 transition-transform origin-left">
            {stats?.pendingVerifications ?? 0}
          </h3>
          <p className="text-[10px] text-amber-600 mt-1 font-semibold underline">Review student ID badges</p>
        </Link>

        <Link to="/admin/confessions" className="neo-outset p-4 bg-[var(--color-surface)] rounded-2xl block hover:border-primary/40 transition-all group">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] uppercase text-[var(--color-on-surface-variant)] font-bold tracking-wider">Confessions</p>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-[var(--color-primary)] group-hover:scale-105 transition-transform origin-left">
            {stats?.totalConfessions ?? 0}
          </h3>
          <p className="text-[10px] text-[var(--color-on-surface-variant)] mt-1 font-medium">Stories posted to feed</p>
        </Link>

        <Link to="/admin/requests" className="neo-outset p-4 bg-[var(--color-surface)] rounded-2xl block hover:border-primary/40 transition-all group">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] uppercase text-[var(--color-on-surface-variant)] font-bold tracking-wider">Open Reports</p>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-[var(--color-primary)] group-hover:scale-105 transition-transform origin-left">
            {stats?.openReports ?? 0}
          </h3>
          <p className="text-[10px] text-rose-600 mt-1 font-semibold">Moderation requests queue</p>
        </Link>
      </div>

      {/* ─── LIVE REAL-TIME ACTIVITY FEED ─── */}
      <div className="flex-1 min-h-0 neo-outset bg-[var(--color-surface)] p-5 sm:p-6 rounded-3xl flex flex-col overflow-hidden shadow-xs">
        <div className="flex justify-between items-center border-b border-[var(--color-outline-variant)] pb-3.5 shrink-0">
          <div>
            <h3 className="text-base font-bold text-[var(--color-on-background)] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Live Activity Feed
            </h3>
            <p className="text-[11px] text-[var(--color-on-surface-variant)] font-medium mt-0.5">Real-time stream of confessions, connect requests, user signups, and moderation events.</p>
          </div>
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Live Stream
          </span>
        </div>

        {activities.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 bg-[var(--color-surface-container-lowest)] border border-dashed border-[var(--color-outline-variant)] rounded-2xl m-3 text-center">
            <MessageSquareQuote className="w-10 h-10 text-[var(--color-on-surface-variant)] opacity-40 mx-auto mb-2" />
            <p className="text-sm font-bold text-[var(--color-on-surface)]">No activity recorded yet</p>
            <p className="text-xs text-[var(--color-on-surface-variant)] mt-1">Actions from students and moderators will show up here automatically.</p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-[var(--color-outline-variant)]/60 pr-1 mt-2">
            {activities.map((item, idx) => (
              <div key={item.id || idx} className="py-3.5 flex items-start justify-between gap-4 group hover:bg-[var(--color-surface-container)]/30 px-3 rounded-2xl transition-colors">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="p-2.5 rounded-2xl bg-[var(--color-surface-container)] border border-[var(--color-outline-variant)] shadow-sm flex-shrink-0 mt-0.5">
                    {getActivityIcon(item.type)}
                  </div>
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[var(--color-on-surface)]">{item.title}</span>
                      {getActivityBadge(item.type, item.status)}
                      {item.college && (
                        <span className="text-[10px] font-semibold text-[var(--color-on-surface-variant)] px-2 py-0.5 rounded-full bg-[var(--color-surface-container-high)] border border-[var(--color-outline-variant)]">
                          🏫 {item.college}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[var(--color-on-surface-variant)] leading-relaxed break-words">{item.description}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0 text-right">
                  <span className="text-[10px] font-semibold text-[var(--color-on-surface-variant)]">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}, {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                  {item.type === 'confession' && (
                    <Link to="/admin/confessions" className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
                      View Story <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                  {item.type === 'interaction' && (
                    <Link to="/admin/requests" className="text-[10px] font-bold text-purple-700 hover:underline flex items-center gap-1">
                      Inspect Request <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                  {item.type === 'user' && (
                    <Link to="/admin/users" className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-1">
                      Manage User <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                  {item.type === 'report' && (
                    <Link to="/admin/requests" className="text-[10px] font-bold text-rose-600 hover:underline flex items-center gap-1">
                      Review Report <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
