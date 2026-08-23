import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { CheckCircle2, XCircle, FileSearch, ShieldCheck, Eye, Clock, User, Building, Mail, ZoomIn, Check, X } from 'lucide-react';

export default function Verifications() {
  const [activeTab, setActiveTab] = useState<'Pending' | 'Approved' | 'Rejected' | 'All'>('Pending');
  const [verifications, setVerifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVerification, setSelectedVerification] = useState<any | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchVerifications = () => {
    setLoading(true);
    api.getPendingVerifications(activeTab)
      .then(res => setVerifications(Array.isArray(res) ? res : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchVerifications();
    const interval = setInterval(() => {
      api.getPendingVerifications(activeTab)
        .then(res => setVerifications(Array.isArray(res) ? res : []))
        .catch(() => {});
    }, 3000);
    window.addEventListener("focus", fetchVerifications);

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", fetchVerifications);
    };
  }, [activeTab]);

  const handleReview = async (id: string, status: 'Approved' | 'Rejected') => {
    setSubmitting(true);
    try {
      await api.reviewVerification(id, status, adminNotes);
      setSelectedVerification(null);
      setAdminNotes('');
      fetchVerifications();
    } catch (err: any) {
      alert(err.message || 'Failed to review verification');
    } finally {
      setSubmitting(false);
    }
  };

  const pendingCount = verifications.filter(v => v.status === 'Pending').length;

  return (
    <div className="space-y-4 animate-in fade-in duration-300 h-full flex flex-col min-h-0">
      <header className="flex justify-between items-start shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-[var(--color-primary-fixed)] text-[var(--color-primary)] rounded">
              Student ID Verification Desk
            </span>
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-on-background)] mt-0.5">
            Student Identity & ID Photo Verifications
          </h2>
          <p className="text-[var(--color-on-surface-variant)] font-medium text-xs">
            Review uploaded College Student IDs & Photos, verify enrollment credentials, and grant Verified Student badges.
          </p>
        </div>

        <button
          onClick={fetchVerifications}
          className="neo-button px-4 py-2 text-xs font-bold text-[var(--color-primary)] rounded-xl flex items-center gap-2 cursor-pointer"
        >
          Refresh Queue
        </button>
      </header>

      {/* Filter Tabs */}
      <div className="flex gap-2 bg-[var(--color-surface)] p-2 rounded-2xl neo-outset w-fit shrink-0">
        {(['Pending', 'Approved', 'Rejected', 'All'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-sm'
                : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Spacious Queue Container */}
      <div className="flex-1 min-h-0 neo-outset flex flex-col rounded-3xl overflow-hidden shadow-xs bg-surface">
        <div className="px-5 py-3.5 border-b border-[var(--color-surface-variant)] flex justify-between items-center bg-surface shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-[var(--color-primary)]">{activeTab} ID Verifications</h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 bg-amber-100 text-amber-900 rounded-md">
              {verifications.length} Total
            </span>
          </div>
          <span className="text-xs font-medium text-[var(--color-on-surface-variant)]">
            Click on any photo to inspect full high-resolution image
          </span>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-[var(--color-on-surface-variant)] text-sm font-semibold animate-pulse">
            Loading student ID photo records...
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-[var(--color-error)] font-bold text-sm">
            Failed to load: {error}
          </div>
        ) : verifications.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-on-surface-variant)] p-8 text-center">
            <FileSearch className="w-12 h-12 opacity-30 mb-2" />
            <p className="text-sm font-bold">No {activeTab.toLowerCase()} ID verifications found.</p>
            <p className="text-xs opacity-70 mt-1">When students complete setup and capture their ID cards, they will be listed here.</p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto neo-inset m-3 p-4 grid grid-cols-1 xl:grid-cols-2 gap-4 rounded-2xl auto-rows-max">
            {verifications.map(ver => (
              <div
                key={ver.id}
                className="bg-white/80 hover:bg-white transition-all p-6 rounded-2xl border border-white/80 shadow-sm flex flex-col justify-between gap-5"
              >
                <div className="flex gap-5 items-start">
                  {ver.studentIdPhotoUrl ? (
                    <div
                      className="w-36 h-28 rounded-2xl overflow-hidden border-2 border-purple-100 shadow-sm cursor-pointer group flex-shrink-0 bg-black/5 relative"
                      onClick={() => setSelectedVerification(ver)}
                    >
                      <img
                        src={ver.studentIdPhotoUrl}
                        alt="Student ID Card"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                        <ZoomIn className="w-6 h-6" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-36 h-28 neo-outset flex flex-col items-center justify-center rounded-2xl bg-[var(--color-surface)] flex-shrink-0 text-gray-400">
                      <FileSearch className="w-8 h-8 mb-1" />
                      <span className="text-[10px] font-bold uppercase">No Document</span>
                    </div>
                  )}

                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base font-bold text-[#1c1c18] truncate">{ver.userRealName}</h4>
                      <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        ver.status === 'Approved'
                          ? 'bg-green-100 text-green-800'
                          : ver.status === 'Rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-amber-100 text-amber-900'
                      }`}>
                        {ver.status}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 flex items-center gap-1 truncate">
                      <Building className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      {ver.college || 'Campus'}
                    </p>

                    <p className="text-xs text-gray-600 flex items-center gap-1 truncate">
                      <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      {ver.userEmail}
                    </p>

                    <p className="text-[11px] text-gray-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Submitted: {new Date(ver.submittedAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <button
                    onClick={() => setSelectedVerification(ver)}
                    className="neo-button px-4 py-2 text-xs font-bold text-[var(--color-primary)] flex items-center gap-1.5 rounded-xl cursor-pointer"
                  >
                    <Eye className="w-4 h-4" /> Inspect Photo
                  </button>

                  <div className="flex items-center gap-2.5">
                    {ver.status !== 'Approved' && (
                      <button
                        onClick={() => handleReview(ver.id, 'Approved')}
                        className="neo-button px-4 py-2 text-xs font-bold text-green-900 bg-green-100 hover:bg-green-200 flex items-center gap-1.5 rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Approve & Grant Badge
                      </button>
                    )}
                    {ver.status !== 'Rejected' && (
                      <button
                        onClick={() => handleReview(ver.id, 'Rejected')}
                        className="neo-button px-4 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 flex items-center gap-1 rounded-xl transition-all active:scale-95 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* High-Resolution ID Photo Review Modal */}
      {selectedVerification && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6 z-50 animate-in fade-in">
          <div className="neo-outset bg-[var(--color-surface)] p-8 rounded-3xl max-w-3xl w-full space-y-6 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-[var(--color-surface-variant)] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-900 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-[var(--color-primary)]">Student ID Document Inspection</h3>
                  <p className="text-xs text-[var(--color-on-surface-variant)]">Verify uploaded identity photo against records</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedVerification(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-bold text-gray-600 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {selectedVerification.studentIdPhotoUrl ? (
              <div className="rounded-2xl overflow-hidden border-2 border-purple-200 shadow-inner bg-black/10 p-3 flex justify-center items-center max-h-96">
                <img
                  src={selectedVerification.studentIdPhotoUrl}
                  alt="Student ID Card Full"
                  className="max-h-88 w-auto object-contain rounded-xl shadow-md"
                />
              </div>
            ) : (
              <div className="p-8 text-center text-gray-400 bg-gray-50 rounded-2xl">
                No ID card photo attached to this record.
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 bg-white/80 p-5 rounded-2xl border">
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase">Student Name</span>
                <p className="text-base font-bold text-[#1c1c18] mt-0.5">{selectedVerification.userRealName}</p>
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase">College / University</span>
                <p className="text-base font-bold text-[var(--color-primary)] mt-0.5">{selectedVerification.college || 'Campus'}</p>
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase">Registered Email</span>
                <p className="text-xs font-semibold text-gray-700 mt-0.5">{selectedVerification.userEmail}</p>
              </div>
              <div>
                <span className="text-[11px] font-bold text-gray-400 uppercase">Status</span>
                <p className="text-xs font-bold text-purple-900 mt-0.5 uppercase">{selectedVerification.status}</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[var(--color-on-surface-variant)] uppercase">Admin Review Notes (Optional)</label>
              <textarea
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                rows={2}
                placeholder="e.g. Verified college enrollment photo and roll credentials."
                className="w-full neo-inset p-3 rounded-xl text-xs mt-1 font-medium bg-white/70"
              />
            </div>

            <div className="flex gap-4 pt-4 border-t">
              <button
                disabled={submitting}
                onClick={() => handleReview(selectedVerification.id, 'Rejected')}
                className="flex-1 py-3.5 neo-button rounded-xl text-sm font-bold text-red-700 bg-red-50 flex items-center justify-center gap-2 hover:bg-red-100 transition-all cursor-pointer"
              >
                <XCircle className="w-5 h-5" /> Reject ID Card
              </button>
              <button
                disabled={submitting}
                onClick={() => handleReview(selectedVerification.id, 'Approved')}
                className="flex-1 py-3.5 neo-button rounded-xl text-sm font-bold text-green-900 bg-green-100 flex items-center justify-center gap-2 hover:bg-green-200 transition-all shadow-md cursor-pointer"
              >
                <CheckCircle2 className="w-5 h-5" /> Approve & Grant Verified Badge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

