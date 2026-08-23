import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  Users, 
  FileSearch, 
  TrendingUp, 
  Lock, 
  Unlock, 
  Search, 
  Sparkles,
  AlertTriangle,
  Award,
  IndianRupee,
  RefreshCw
} from 'lucide-react';
import { adminApi, PendingVerification, AdminUser } from '../services/admin';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'verifications' | 'users' | 'analytics'>('verifications');
  const [verifications, setVerifications] = useState<PendingVerification[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Review Modal State
  const [selectedVerification, setSelectedVerification] = useState<PendingVerification | null>(null);
  const [adminNotes, setAdminNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [vData, uData] = await Promise.all([
      adminApi.getPendingVerifications(),
      adminApi.getAllUsers()
    ]);
    setVerifications(vData);
    setUsers(uData);
    setLoading(false);
  };

  const handleReview = async (status: 'Approved' | 'Rejected') => {
    if (!selectedVerification) return;
    setSubmitting(true);
    await adminApi.reviewVerification(selectedVerification.id, status, adminNotes);
    setVerifications(prev => prev.filter(v => v.id !== selectedVerification.id));
    setSelectedVerification(null);
    setAdminNotes('');
    setSubmitting(false);
  };

  const handleToggleBan = async (userId: string) => {
    await adminApi.banUser(userId);
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u));
  };

  const filteredVerifications = verifications.filter(v => 
    v.userRealName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    v.college.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (v.extractedStudentId && v.extractedStudentId.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredUsers = users.filter(u => 
    u.realName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.mysteryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.college.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getConfidenceBadge = (confidence: number) => {
    const pct = Math.round(confidence * 100);
    if (pct >= 85) return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">High ({pct}%)</span>;
    if (pct >= 70) return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">Medium ({pct}%)</span>;
    return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">Low ({pct}%)</span>;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans">
      {/* Top Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-600 to-pink-500 text-white shadow-lg shadow-purple-500/20">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-purple-100 to-purple-300 bg-clip-text text-transparent">
                Admin Control Center
              </h1>
            </div>
            <p className="text-slate-400 text-sm mt-1">Review student ID cards, monitor OCR confidence score, and manage platform safety.</p>
          </div>

          <button 
            onClick={loadData}
            className="self-start md:self-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 border border-slate-700/60 hover:border-purple-500/50 text-slate-300 hover:text-white transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh Data
          </button>
        </div>

        {/* Quick Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending ID Reviews</span>
              <FileSearch className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-bold mt-2 text-amber-300">{verifications.length}</div>
            <span className="text-xs text-slate-500 mt-1 inline-block">Requires manual review</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Registered Users</span>
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-3xl font-bold mt-2 text-purple-300">{users.length}</div>
            <span className="text-xs text-slate-500 mt-1 inline-block">Across college campuses</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Verified Students</span>
              <Award className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold mt-2 text-emerald-300">
              {users.filter(u => u.isStudentVerified).length}
            </div>
            <span className="text-xs text-slate-500 mt-1 inline-block">OCR ID status approved</span>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Chat Unlock Revenue</span>
              <IndianRupee className="w-5 h-5 text-pink-400" />
            </div>
            <div className="text-3xl font-bold mt-2 text-pink-300">₹841</div>
            <span className="text-xs text-slate-500 mt-1 inline-block">29 Unlocks via Razorpay</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('verifications')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'verifications'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileSearch className="w-4 h-4" />
              Pending ID Photos ({verifications.length})
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'users'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-4 h-4" />
              All Registered Users ({users.length})
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'analytics'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              Platform Analytics
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, college, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Main Content Sections */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'verifications' && (
          <div>
            {filteredVerifications.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/30 border border-slate-800/60 rounded-2xl">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-80" />
                <h3 className="text-lg font-semibold text-slate-200">No Pending Student ID Verifications</h3>
                <p className="text-slate-500 text-sm mt-1">All uploaded student ID cards have been reviewed!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVerifications.map((item) => (
                  <div key={item.id} className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden hover:border-purple-500/40 transition-all flex flex-col justify-between shadow-xl">
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div>
                          <h3 className="font-bold text-base text-white">{item.userRealName}</h3>
                          <p className="text-xs text-slate-400">{item.userEmail}</p>
                        </div>
                        {getConfidenceBadge(item.ocrConfidence)}
                      </div>

                      {/* Photo Thumbnail */}
                      <div className="relative h-44 w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 my-3 group">
                        <img 
                          src={item.studentIdPhotoUrl} 
                          alt="Student ID Upload" 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <button
                          onClick={() => setSelectedVerification(item)}
                          className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2 text-xs font-semibold text-white transition-opacity backdrop-blur-xs"
                        >
                          <Eye className="w-4 h-4" /> Inspect ID & OCR
                        </button>
                      </div>

                      {/* Extracted Details Pill Grid */}
                      <div className="space-y-1.5 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-500">OCR Extracted Name:</span>
                          <span className="font-medium text-slate-200">{item.extractedName || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Extracted Roll / ID:</span>
                          <span className="font-mono text-purple-300 font-semibold">{item.extractedStudentId || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">College:</span>
                          <span className="font-medium text-slate-300 truncate max-w-[150px]">{item.extractedCollege || item.college}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950/40 border-t border-slate-800/80 flex items-center gap-3">
                      <button
                        onClick={() => setSelectedVerification(item)}
                        className="flex-1 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-600/20"
                      >
                        Review & Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="p-4 font-semibold">User Details</th>
                    <th className="p-4 font-semibold">Mystery Name</th>
                    <th className="p-4 font-semibold">College</th>
                    <th className="p-4 font-semibold">Verification</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-white">{user.realName}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </td>
                      <td className="p-4">
                        <span className="font-mono text-xs text-purple-300 bg-purple-950/50 px-2 py-1 rounded-md border border-purple-800/40">
                          @{user.mysteryName}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300">{user.college}</td>
                      <td className="p-4">
                        {user.isStudentVerified ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-amber-400 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5" /> Pending
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        {user.isActive ? (
                          <span className="px-2 py-0.5 text-xs font-semibold text-emerald-400 bg-emerald-950/60 rounded-full border border-emerald-800/40">Active</span>
                        ) : (
                          <span className="px-2 py-0.5 text-xs font-semibold text-rose-400 bg-rose-950/60 rounded-full border border-rose-800/40">Banned</span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleToggleBan(user.id)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            user.isActive 
                              ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                          }`}
                        >
                          {user.isActive ? 'Ban Account' : 'Unban Account'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-400" /> Platform Security & Verification
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Our Tesseract AI OCR pipeline automatically scans student identity card photos uploaded during onboarding, calculating text similarity, roll number validity, and college seal confidence scores.
              </p>
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">OCR Automatic Pass Rate:</span>
                  <span className="font-bold text-emerald-400">92.4%</span>
                </div>
                <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                  <div className="bg-emerald-400 h-full w-[92.4%]"></div>
                </div>

                <div className="flex justify-between items-center text-sm pt-2">
                  <span className="text-slate-400">Average Review SLA:</span>
                  <span className="font-bold text-purple-300">&lt; 15 Minutes</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <IndianRupee className="w-5 h-5 text-pink-400" /> Razorpay Unlock Metrics
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                Chat rooms remain free for the initial 30 days. After trial, users unlock unlimited end-to-end chat via Razorpay ₹29 micropayments.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-500">Successful Transactions</span>
                  <div className="text-2xl font-bold text-white mt-1">29</div>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-xs text-slate-500">Payment Conversion</span>
                  <div className="text-2xl font-bold text-pink-400 mt-1">88.5%</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedVerification && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setSelectedVerification(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-lg font-bold"
            >
              ✕
            </button>

            <h2 className="text-xl font-bold text-white mb-1">Inspect & Review Student ID</h2>
            <p className="text-xs text-slate-400 mb-4">Submitted by {selectedVerification.userRealName} ({selectedVerification.userEmail})</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-950 p-2 rounded-xl border border-slate-800 h-56 flex items-center justify-center overflow-hidden">
                <img 
                  src={selectedVerification.studentIdPhotoUrl} 
                  alt="Student ID Full" 
                  className="max-h-full max-w-full object-contain rounded-lg"
                />
              </div>

              <div className="space-y-3 bg-slate-950/60 p-4 rounded-xl border border-slate-800 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-slate-400">OCR Confidence:</span>
                  {getConfidenceBadge(selectedVerification.ocrConfidence)}
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Extracted Name:</span>
                  <span className="font-semibold text-white text-sm">{selectedVerification.extractedName || 'Not detected'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">Student ID / Roll No:</span>
                  <span className="font-mono text-purple-300 font-bold text-sm">{selectedVerification.extractedStudentId || 'Not detected'}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-0.5">College Campus:</span>
                  <span className="font-medium text-slate-200">{selectedVerification.extractedCollege || selectedVerification.college}</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-semibold text-slate-400 mb-2">Admin Notes (Optional)</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="e.g. Student ID verified successfully against DTU database records."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-purple-500 h-20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                disabled={submitting}
                onClick={() => handleReview('Rejected')}
                className="px-4 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 text-xs font-bold transition-all flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" /> Reject ID Card
              </button>
              <button
                disabled={submitting}
                onClick={() => handleReview('Approved')}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
