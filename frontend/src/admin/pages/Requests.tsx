import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { ConnectionRequest } from '../types/models';
import { CheckCircle, XCircle, ShieldAlert, HeartHandshake, Trash2, Eye, MessageSquare, User, Clock, ArrowRight, Check, Ban } from 'lucide-react';

export default function Requests() {
  const [activeTab, setActiveTab] = useState<'reports' | 'interactions'>('interactions');
  const [reports, setReports] = useState<ConnectionRequest[]>([]);
  const [interactions, setInteractions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Expanded details modal
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [modalType, setModalType] = useState<'report' | 'interaction' | null>(null);

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.getReports(),
      api.getInteractionRequests()
    ])
      .then(([repRes, intRes]) => {
        setReports(repRes.requests || []);
        setInteractions(intRes.requests || []);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleResolveReport = async (id: string, status: 'accepted' | 'declined') => {
    if (!window.confirm(`Are you sure you want to ${status === 'accepted' ? 'RESOLVE' : 'DISMISS'} this report?`)) return;
    try {
      await api.resolveReport(id, status);
      setSelectedItem(null);
      fetchAll();
    } catch (err: any) {
      alert(err.message || 'Failed to update report status');
    }
  };

  const handleApproveInteraction = async (id: string) => {
    if (!window.confirm('Approve this interaction request and establish a live chat room between both students?')) return;
    try {
      await api.approveInteractionRequest(id);
      setSelectedItem(null);
      fetchAll();
    } catch (err: any) {
      alert(err.message || 'Failed to approve interaction');
    }
  };

  const handleDeclineInteraction = async (id: string) => {
    if (!window.confirm('Decline this interaction request?')) return;
    try {
      await api.declineInteractionRequest(id);
      setSelectedItem(null);
      fetchAll();
    } catch (err: any) {
      alert(err.message || 'Failed to decline interaction');
    }
  };

  const handleDeleteInteraction = async (id: string) => {
    if (!window.confirm('Permanently remove this interaction request from the queue?')) return;
    try {
      await api.deleteInteractionRequest(id);
      setSelectedItem(null);
      fetchAll();
    } catch (err: any) {
      alert(err.message || 'Failed to delete interaction');
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 h-full flex flex-col min-h-0">
      <header className="flex justify-between items-start shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-[var(--color-primary-fixed)] text-[var(--color-primary)] rounded">
              Live Operations Queue
            </span>
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-on-background)] mt-0.5">
            Requests & Moderation Review Desk
          </h2>
          <p className="text-[var(--color-on-surface-variant)] font-medium text-xs">
            Review student interaction requests from the feed, approve connections, and moderate flagged abuse reports.
          </p>
        </div>

        <button
          onClick={fetchAll}
          className="neo-button px-4 py-2 text-xs font-bold text-[var(--color-primary)] rounded-xl flex items-center gap-2 cursor-pointer"
        >
          Refresh Queue
        </button>
      </header>

      {/* Spacious Tab Selector */}
      <div className="flex gap-2 bg-[var(--color-surface)] p-2 rounded-2xl neo-outset w-fit shrink-0">
        <button
          onClick={() => setActiveTab('interactions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'interactions'
              ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-sm'
              : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          Feed Interaction Requests ({interactions.length})
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-sm'
              : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          Abuse Reports ({reports.length})
        </button>
      </div>

      {/* Main Review Box - Maximized and Spacious */}
      <div className="flex-1 min-h-0 neo-outset flex flex-col rounded-3xl overflow-hidden shadow-xs bg-surface">
        <div className="px-5 py-3.5 border-b border-[var(--color-surface-variant)] flex justify-between items-center bg-surface shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-[var(--color-primary)]">
              {activeTab === 'interactions' ? 'Feed Story Interaction Queue' : 'Flagged Reports & Violations'}
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 bg-[var(--color-primary-fixed)] rounded-md text-[var(--color-primary)]">
              {activeTab === 'interactions' ? `${interactions.length} Total Requests` : `${reports.length} Total Reports`}
            </span>
          </div>
          <span className="text-xs font-medium text-[var(--color-on-surface-variant)]">
            Click any card to inspect full details
          </span>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-[var(--color-on-surface-variant)] text-sm font-semibold animate-pulse">
            Loading requests from database...
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-[var(--color-error)] font-bold text-sm">
            Failed to load: {error}
          </div>
        ) : activeTab === 'interactions' ? (
          interactions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-on-surface-variant)] p-8 text-center">
              <HeartHandshake className="w-12 h-12 opacity-30 mb-2" />
              <p className="text-sm font-bold">No interaction requests pending.</p>
              <p className="text-xs opacity-70 mt-1">When students click 'INTERACT' on confessions in the feed, requests appear here for admin review.</p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto neo-inset m-3 p-4 flex flex-col gap-4">
              {interactions.map(item => (
                <div
                  key={item.id}
                  className="bg-white/60 hover:bg-white/80 transition-all p-6 rounded-2xl border border-white/80 shadow-sm flex flex-col gap-4"
                >
                  {/* Top Bar: Users and Badges */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 neo-outset flex items-center justify-center rounded-2xl bg-purple-50 text-purple-700 font-bold text-lg">
                        <HeartHandshake className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="text-base font-bold text-[#1c1c18]">
                            👤 {item.requesterName}
                          </span>
                          <ArrowRight className="w-4 h-4 text-gray-400" />
                          <span className="text-base font-bold text-[var(--color-primary)]">
                            👑 {item.targetName} (Author)
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            item.status === 'Accepted'
                              ? 'bg-green-100 text-green-800'
                              : item.status === 'Declined'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}>
                            Status: {item.status || 'Pending'}
                          </span>
                          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
                            Type: {item.response || 'InteractRequested'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </div>

                  {/* Confession Story Quote Box */}
                  {item.confessionContent && (
                    <div className="bg-white/90 p-4 rounded-xl border border-purple-100 shadow-inner">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-purple-800 uppercase tracking-wide mb-1.5">
                        <MessageSquare className="w-3.5 h-3.5" /> Confession Story
                      </div>
                      <p className="text-sm font-medium text-gray-800 leading-relaxed italic">
                        "{item.confessionContent}"
                      </p>
                    </div>
                  )}

                  {/* Action Buttons Row */}
                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <button
                      onClick={() => { setSelectedItem(item); setModalType('interaction'); }}
                      className="neo-button px-4 py-2 text-xs font-bold text-[var(--color-primary)] flex items-center gap-1.5 rounded-xl"
                    >
                      <Eye className="w-4 h-4" /> Full Inspection
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleApproveInteraction(item.id)}
                        className="neo-button px-5 py-2.5 text-xs font-bold text-green-800 bg-green-100 hover:bg-green-200 flex items-center gap-1.5 rounded-xl shadow-sm transition-all active:scale-95"
                      >
                        <Check className="w-4 h-4" /> Approve & Create Chat Room
                      </button>

                      <button
                        onClick={() => handleDeclineInteraction(item.id)}
                        className="neo-button px-5 py-2.5 text-xs font-bold text-amber-800 bg-amber-100 hover:bg-amber-200 flex items-center gap-1.5 rounded-xl transition-all active:scale-95"
                      >
                        <XCircle className="w-4 h-4" /> Decline
                      </button>

                      <button
                        onClick={() => handleDeleteInteraction(item.id)}
                        className="neo-button px-3.5 py-2.5 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 flex items-center gap-1 rounded-xl transition-all"
                        title="Delete Request"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          reports.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-on-surface-variant)] p-8 text-center">
              <ShieldAlert className="w-12 h-12 opacity-30 mb-2" />
              <p className="text-sm font-bold">No abuse reports pending.</p>
              <p className="text-xs opacity-70 mt-1">Platform community is healthy! Flagged content reports will show here.</p>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto neo-inset m-3 p-4 flex flex-col gap-4">
              {reports.map(rep => (
                <div
                  key={rep.id}
                  className="bg-white/60 hover:bg-white/80 transition-all p-6 rounded-2xl border border-white/80 shadow-sm flex flex-col gap-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 neo-outset flex items-center justify-center rounded-2xl bg-red-50 text-red-700 font-bold text-lg">
                        <ShieldAlert className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-base font-bold text-[#1c1c18]">
                            Reported By: {rep.fromUser}
                          </p>
                          <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            rep.status === 'resolved' || rep.status === 'accepted'
                              ? 'bg-green-100 text-green-800'
                              : rep.status === 'dismissed' || rep.status === 'declined'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {rep.status}
                          </span>
                        </div>
                        <p className="text-sm font-semibold text-red-900 mt-1">
                          Reason: {rep.reason || 'Flagged violation'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(rep.timestamp).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                    <button
                      onClick={() => { setSelectedItem(rep); setModalType('report'); }}
                      className="neo-button px-4 py-2 text-xs font-bold text-[var(--color-primary)] flex items-center gap-1.5 rounded-xl"
                    >
                      <Eye className="w-4 h-4" /> Full Report Details
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleResolveReport(rep.id, 'accepted')}
                        className="neo-button px-5 py-2.5 text-xs font-bold text-green-800 bg-green-100 hover:bg-green-200 flex items-center gap-1.5 rounded-xl shadow-sm transition-all"
                      >
                        <CheckCircle className="w-4 h-4" /> Resolve & Take Action
                      </button>
                      <button
                        onClick={() => handleResolveReport(rep.id, 'declined')}
                        className="neo-button px-5 py-2.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 flex items-center gap-1.5 rounded-xl transition-all"
                      >
                        <XCircle className="w-4 h-4" /> Dismiss Report
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Maximized Detail & Inspection Modal */}
      {selectedItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-in fade-in">
          <div className="neo-outset bg-[var(--color-surface)] p-8 rounded-3xl max-w-2xl w-full space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[var(--color-surface-variant)] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-fixed)] flex items-center justify-center text-[var(--color-primary)] font-bold">
                  {modalType === 'interaction' ? <HeartHandshake className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[var(--color-primary)]">
                    {modalType === 'interaction' ? 'Interaction Request Inspection' : 'Abuse Report Inspection'}
                  </h3>
                  <p className="text-xs text-[var(--color-on-surface-variant)]">Detailed record verification</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedItem(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600"
              >
                ✕
              </button>
            </div>

            {modalType === 'interaction' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 bg-white/60 p-4 rounded-2xl border">
                  <div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase">Requester (Clicked Interact)</span>
                    <p className="text-sm font-bold text-[#1c1c18] mt-0.5">{selectedItem.requesterName}</p>
                    {selectedItem.requesterEmail && (
                      <p className="text-xs text-gray-500">{selectedItem.requesterEmail}</p>
                    )}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase">Target (Confession Author)</span>
                    <p className="text-sm font-bold text-[var(--color-primary)] mt-0.5">{selectedItem.targetName}</p>
                  </div>
                </div>

                {selectedItem.confessionContent && (
                  <div className="bg-white/90 p-5 rounded-2xl border border-purple-100 shadow-inner">
                    <span className="text-xs font-bold text-purple-900 uppercase">Full Confession Story</span>
                    <p className="text-sm font-medium text-gray-800 leading-relaxed mt-2 italic">
                      "{selectedItem.confessionContent}"
                    </p>
                  </div>
                )}

                <div className="flex gap-4 pt-4 border-t">
                  <button
                    onClick={() => handleApproveInteraction(selectedItem.id)}
                    className="flex-1 py-3 neo-button rounded-xl text-sm font-bold text-green-800 bg-green-100 flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" /> Approve & Connect Students
                  </button>
                  <button
                    onClick={() => handleDeclineInteraction(selectedItem.id)}
                    className="flex-1 py-3 neo-button rounded-xl text-sm font-bold text-amber-800 bg-amber-100 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" /> Decline Request
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-white/60 p-4 rounded-2xl border space-y-2">
                  <p><strong>Reporter:</strong> {selectedItem.fromUser}</p>
                  <p><strong>Reason:</strong> {selectedItem.reason}</p>
                  <p><strong>Date:</strong> {new Date(selectedItem.timestamp).toLocaleString()}</p>
                </div>

                <div className="flex gap-4 pt-4 border-t">
                  <button
                    onClick={() => handleResolveReport(selectedItem.id, 'accepted')}
                    className="flex-1 py-3 neo-button rounded-xl text-sm font-bold text-green-800 bg-green-100 flex items-center justify-center gap-2"
                  >
                    <CheckCircle className="w-5 h-5" /> Resolve & Ban/Take Action
                  </button>
                  <button
                    onClick={() => handleResolveReport(selectedItem.id, 'declined')}
                    className="flex-1 py-3 neo-button rounded-xl text-sm font-bold text-gray-700 bg-gray-100 flex items-center justify-center gap-2"
                  >
                    <XCircle className="w-5 h-5" /> Dismiss Report
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
