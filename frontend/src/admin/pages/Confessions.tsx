import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Confession } from '../types/models';
import { Filter, Eye, EyeOff, Trash2, Megaphone, Pin, Plus } from 'lucide-react';

export default function Confessions() {
  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  // Super Admin Broadcast Confession
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState('All Campus Students');
  const [broadcastIsOfficial, setBroadcastIsOfficial] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchConfessions = () => {
    setLoading(true);
    api.getConfessions(statusFilter)
      .then(res => setConfessions(res.confessions))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchConfessions();
  }, [statusFilter]);

  const moderate = async (id: string, status: Confession['status']) => {
    if (!window.confirm(`Are you sure you want to change this confession's status to ${status}?`)) return;
    try {
      await api.moderateConfession(id, status);
      fetchConfessions();
    } catch (err: any) {
      alert(err.message || 'Failed to moderate confession');
    }
  };

  const handlePostAdminBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastContent.trim()) return;
    setSubmitting(true);
    try {
      await api.createOfficialConfession(
        broadcastContent,
        'public',
        broadcastTarget
      );
      setShowBroadcastModal(false);
      setBroadcastContent('');
      fetchConfessions();
    } catch (err) {
      alert('Failed to post admin broadcast');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 h-full flex flex-col min-h-0">
      <header className="flex justify-between items-start shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-[var(--color-primary-fixed)] text-[var(--color-primary)] rounded">
              Super Admin Moderation
            </span>
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-on-background)] mt-0.5">Confession Moderation & Broadcasts</h2>
          <p className="text-[var(--color-on-surface-variant)] font-medium text-xs">Review, moderate, and publish official campus broadcasts directly into feeds.</p>
        </div>

        <button
          onClick={() => setShowBroadcastModal(true)}
          className="neo-button px-4 py-2 text-xs font-bold text-[var(--color-primary)] flex items-center gap-2 rounded-xl cursor-pointer"
        >
          <Megaphone className="w-4 h-4" /> Post Official Broadcast
        </button>
      </header>

      <div className="flex items-center gap-3 bg-[var(--color-surface)] p-3 rounded-2xl neo-outset shrink-0">
        <div className="flex items-center gap-2 bg-[var(--color-surface-container)] rounded-xl px-3.5 py-1.5 neo-inset">
          <Filter className="w-4 h-4 text-[var(--color-on-surface-variant)]" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-transparent border-none outline-none text-xs font-bold text-[var(--color-on-surface)] cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="visible">Visible</option>
            <option value="hidden">Hidden</option>
            <option value="removed">Removed</option>
          </select>
        </div>
      </div>

      <div className="flex-1 min-h-0 neo-outset flex flex-col rounded-3xl overflow-hidden shadow-xs bg-surface">
        <div className="px-5 py-3.5 border-b border-[var(--color-surface-variant)] flex justify-between items-center bg-surface shrink-0">
          <h2 className="text-base font-bold text-[var(--color-primary)]">Confessions Stream ({confessions.length})</h2>
          <span className="text-[11px] font-semibold px-2 py-0.5 bg-[#ffdad6] text-[#ba1a1a] rounded-md">Live Moderator Queue</span>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-[var(--color-on-surface-variant)] animate-pulse text-sm font-semibold">
            Loading confessions...
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-[var(--color-error)] font-bold text-sm">Failed to load: {error}</div>
        ) : confessions.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-on-surface-variant)] p-8 text-center">
            <p className="text-sm font-bold">No confessions found matching filter.</p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto neo-inset m-3 p-4 flex flex-col gap-3.5">
            {confessions.map(conf => (
              <div key={conf.id} className={`border-l-4 ${
                conf.isOfficial ? 'border-purple-600' :
                conf.reportCount > 0 ? 'border-[#ba1a1a]' : 'border-amber-500'
              } bg-white/30 p-4 rounded-r-2xl shadow-sm border border-white/60`}>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {conf.isOfficial && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-900 flex items-center gap-1">
                        <Pin className="w-3 h-3" /> OFFICIAL ADMIN BROADCAST
                      </span>
                    )}
                    {conf.reportCount > 0 && (
                      <span className="text-[10px] font-bold uppercase text-[#ba1a1a]">
                        Reported by {conf.reportCount} users
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      conf.type === 'public' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {conf.type}
                    </span>
                  </div>
                  <span className="text-[10px] opacity-50">{new Date(conf.time).toLocaleString()}</span>
                </div>
                
                <div className="flex items-center gap-2 mb-2 text-xs font-medium text-[var(--color-on-surface-variant)]">
                  <span className="font-bold">Author: {conf.author}</span>
                  {conf.targetPerson && (
                    <span className="bg-[var(--color-surface-container-high)] px-2 py-0.5 rounded-full font-bold">
                      Target: {conf.targetPerson}
                    </span>
                  )}
                  <span className={`px-2 py-0.5 rounded-md font-bold ${
                    conf.status === 'visible' ? 'bg-green-100 text-green-800' :
                    conf.status === 'hidden' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-[#ffdad6] text-[#ba1a1a]'
                  }`}>
                    {conf.status.toUpperCase()}
                  </span>
                </div>

                <p className="text-sm text-[#1c1c18] font-medium leading-snug mb-3 bg-white/50 p-3 rounded-xl border border-white/60">
                  "{conf.content}"
                </p>
                
                <div className="flex gap-2">
                  {conf.status !== 'visible' && (
                    <button onClick={() => moderate(conf.id, 'visible')} className="neo-button px-3 py-1.5 text-xs font-bold text-green-700 flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> Restore
                    </button>
                  )}
                  {conf.status !== 'hidden' && (
                    <button onClick={() => moderate(conf.id, 'hidden')} className="neo-button px-3 py-1.5 text-xs font-bold text-amber-700 flex items-center gap-1">
                      <EyeOff className="w-3.5 h-3.5" /> Hide
                    </button>
                  )}
                  {conf.status !== 'removed' && (
                    <button onClick={() => moderate(conf.id, 'removed')} className="neo-button px-3 py-1.5 text-xs font-bold text-[#ba1a1a] flex items-center gap-1">
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="neo-outset bg-[var(--color-surface)] p-6 rounded-3xl max-w-lg w-full space-y-4">
            <div className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-purple-700" />
              <h3 className="text-lg font-bold text-[var(--color-primary)]">Create Official Admin Broadcast</h3>
            </div>
            <p className="text-xs text-[var(--color-on-surface-variant)]">This message will be published directly into the public campus feed with an official verified badge.</p>

            <form onSubmit={handlePostAdminBroadcast} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--color-on-surface-variant)]">Broadcast Content</label>
                <textarea
                  required
                  rows={4}
                  value={broadcastContent}
                  onChange={e => setBroadcastContent(e.target.value)}
                  className="w-full neo-inset p-3 rounded-xl text-xs mt-1"
                  placeholder="e.g. Official Announcement: Annual Cultural Fest Registrations are now open! Check details in campus portal."
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--color-on-surface-variant)]">Target Audience / Subject</label>
                <input
                  type="text"
                  value={broadcastTarget}
                  onChange={e => setBroadcastTarget(e.target.value)}
                  className="w-full neo-inset p-3 rounded-xl text-xs mt-1 font-bold text-[var(--color-primary)]"
                  placeholder="e.g. All Students, Batch 2026, CSE Department"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="officialCheck"
                  checked={broadcastIsOfficial}
                  onChange={e => setBroadcastIsOfficial(e.target.checked)}
                  className="rounded text-purple-600 focus:ring-purple-500"
                />
                <label htmlFor="officialCheck" className="text-xs font-bold text-[var(--color-on-surface)]">
                  Attach Official Super Admin Badge
                </label>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="flex-1 py-2.5 neo-button rounded-xl text-xs font-bold text-[var(--color-on-surface-variant)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 neo-button rounded-xl text-xs font-bold text-purple-900 bg-purple-100 flex items-center justify-center gap-2"
                >
                  <Megaphone className="w-4 h-4" /> Publish Broadcast
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


