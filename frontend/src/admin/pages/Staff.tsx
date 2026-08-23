import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { StaffAdmin } from '../types/models';
import { Shield, UserPlus, Power, Trash2, Key, CheckCircle } from 'lucide-react';
import { useAuth } from '../store/AuthContext';

export default function Staff() {
  const { isSuperAdmin } = useAuth();
  const [staff, setStaff] = useState<StaffAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Staff Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Senior Moderator' | 'Admin' | 'Content Auditor'>('Admin');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const loadStaff = () => {
    setLoading(true);
    api.getStaffAdmins()
      .then(setStaff)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await api.toggleStaffAdminStatus(id, nextStatus);
      setStaff(prev => prev.map(s => s.id === id ? { ...s, status: nextStatus } : s));
    } catch (err: any) {
      alert(err.message || 'Failed to toggle status');
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.addStaffAdmin({ email, role });
      setMessage(`Added admin permissions for ${email}`);
      setShowAddModal(false);
      setEmail('');
      loadStaff();
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to add staff admin. Ensure user is registered first.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 h-full flex flex-col min-h-0">
      <header className="flex justify-between items-start shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-amber-100 text-amber-900 rounded">
              👑 Super Admin Control
            </span>
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-on-background)] mt-0.5">Staff & Admin Access</h2>
          <p className="text-[var(--color-on-surface-variant)] font-medium text-xs">
            Delegate moderator privileges, promote users to Admins, and manage operational staff team permissions.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="neo-button px-4 py-2 text-xs font-bold text-[var(--color-primary)] flex items-center gap-2 rounded-xl cursor-pointer"
          >
            <UserPlus className="w-4 h-4" /> Grant Admin Access
          </button>
        )}
      </header>

      {message && (
        <div className="p-3 bg-green-100 text-green-900 rounded-xl text-xs font-bold flex items-center gap-2 shrink-0">
          <CheckCircle className="w-4 h-4" /> {message}
        </div>
      )}

      <div className="flex-1 min-h-0 neo-outset flex flex-col rounded-3xl overflow-hidden shadow-xs bg-surface">
        <div className="px-5 py-3.5 border-b border-[var(--color-surface-variant)] flex justify-between items-center bg-surface shrink-0">
          <h2 className="text-base font-bold text-[var(--color-primary)]">Admin Staff Team ({staff.length})</h2>
          <span className="text-[11px] font-semibold px-2 py-0.5 bg-purple-100 text-purple-900 rounded-md">High Privilege Accounts</span>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-[var(--color-on-surface-variant)] animate-pulse text-sm font-semibold">
            Loading staff...
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-[var(--color-error)] font-bold text-sm">Failed to load: {error}</div>
        ) : staff.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-on-surface-variant)] p-8 text-center">
            <p className="text-sm font-bold">No staff administrators configured.</p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto neo-inset m-3 p-4 flex flex-col gap-3">
            {staff.map(member => (
              <div key={member.id} className="bg-white/40 p-4 rounded-2xl flex items-center justify-between border border-white/60">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 neo-outset flex items-center justify-center rounded-2xl bg-[var(--color-surface)] font-bold text-lg text-[var(--color-primary)]">
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold">{member.name}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        member.role === 'Super Admin'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-purple-100 text-purple-900'
                      }`}>
                        {member.role === 'Super Admin' ? '👑 Super Admin' : '🛡 Admin'}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {member.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--color-on-surface-variant)]">{member.email}</p>
                    <p className="text-[10px] text-gray-400 mt-1">Last activity: {new Date(member.lastLogin).toLocaleString()}</p>
                  </div>
                </div>

                {isSuperAdmin && member.role !== 'Super Admin' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleStatus(member.id, member.status)}
                      className={`neo-button px-3 py-1.5 text-xs font-bold flex items-center gap-1 ${
                        member.status === 'active' ? 'text-amber-700 bg-amber-50' : 'text-green-700 bg-green-50'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" /> {member.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="neo-outset bg-[var(--color-surface)] p-6 rounded-3xl max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-[var(--color-primary)]">Promote User to Admin</h3>
            <p className="text-xs text-[var(--color-on-surface-variant)]">
              Enter the registered email of the user to promote to the Admin team.
            </p>

            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--color-on-surface-variant)]">User Registered Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="student@college.edu or username@finding.app"
                  className="w-full neo-inset p-3 rounded-xl text-xs mt-1"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[var(--color-on-surface-variant)]">Role / Level</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value as any)}
                  className="w-full neo-inset p-3 rounded-xl text-xs mt-1"
                >
                  <option value="Admin">🛡 Admin (Moderator & Content Control)</option>
                  <option value="Senior Moderator">🛡 Senior Moderator</option>
                  <option value="Content Auditor">🛡 Content Auditor</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 neo-button rounded-xl text-xs font-bold text-[var(--color-on-surface-variant)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 neo-button rounded-xl text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary-fixed)]"
                >
                  {submitting ? 'Granting...' : 'Grant Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
