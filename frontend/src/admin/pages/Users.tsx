import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { UserProfile } from '../types/models';
import { Search, Filter, ShieldCheck, Ban, X, User, UserPlus, Trash2, CheckCircle, Edit3, Award } from 'lucide-react';
import { useAuth } from '../store/AuthContext';

export default function Users() {
  const { isSuperAdmin } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Modals & Edit States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<UserProfile>>({});

  // New User Form State
  const [newName, setNewName] = useState('');
  const [newSecretName, setNewSecretName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newSemester, setNewSemester] = useState('1');

  const fetchUsers = () => {
    setLoading(true);
    api.getUsers(statusFilter, search)
      .then(res => setUsers(res.users))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const updateStatus = async (id: string, status: UserProfile['status']) => {
    if (!window.confirm(`Are you sure you want to change this user's status to ${status}?`)) return;
    try {
      await api.updateUserStatus(id, status);
      fetchUsers();
      if (selectedUser && selectedUser.id === id) {
        setSelectedUser({ ...selectedUser, status });
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update user status');
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser({
        name: newName,
        secretName: newSecretName,
        email: newEmail,
        semester: newSemester,
        status: 'active'
      });
      setShowCreateModal(false);
      setNewName('');
      setNewSecretName('');
      setNewEmail('');
      fetchUsers();
    } catch (err) {
      alert('Failed to create user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('SUPER ADMIN WARNING: Are you sure you want to PERMANENTLY DELETE this user account? This cannot be undone.')) return;
    try {
      await api.deleteUser(id);
      setSelectedUser(null);
      fetchUsers();
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  const handleToggleBadge = async (user: UserProfile) => {
    const isVerifiedBadge = !user.isVerifiedBadge;
    try {
      const updated = await api.updateUser(user.id, {
        isVerifiedBadge,
        status: isVerifiedBadge ? 'active' : 'pending_verification',
      });
      setSelectedUser(updated);
      fetchUsers();
    } catch (err) {
      alert('Failed to toggle badge');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    try {
      const updated = await api.updateUser(selectedUser.id, editForm);
      setSelectedUser(updated);
      setIsEditing(false);
      fetchUsers();
    } catch (err) {
      alert('Failed to save profile changes');
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 h-full flex flex-col min-h-0 relative">
      <header className="flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-[var(--color-primary-fixed)] text-[var(--color-primary)] rounded">
              Super Admin View
            </span>
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-on-background)] mt-0.5">User Management & Accounts</h2>
          <p className="text-[var(--color-on-surface-variant)] font-medium text-xs">Full authority over student accounts, verification badges, and account lifecycles.</p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="neo-button px-4 py-2 text-xs font-bold text-[var(--color-primary)] flex items-center gap-2 rounded-xl cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Create New User
        </button>
      </header>

      {/* Quick Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 shrink-0">
        <div className="p-2.5 sm:p-3 bg-surface rounded-xl neo-outset flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Total Students</span>
            <p className="text-lg sm:text-xl font-extrabold text-on-surface mt-0.5">{users.length}</p>
          </div>
          <User className="w-6 h-6 text-primary opacity-80" />
        </div>

        <div className="p-2.5 sm:p-3 bg-surface rounded-xl neo-outset flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Verified Badges</span>
            <p className="text-lg sm:text-xl font-extrabold text-blue-600 mt-0.5">
              {users.filter(u => u.isVerifiedBadge).length}
            </p>
          </div>
          <ShieldCheck className="w-6 h-6 text-blue-500 opacity-80" />
        </div>

        <div className="p-2.5 sm:p-3 bg-surface rounded-xl neo-outset flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Pending IDs</span>
            <p className="text-lg sm:text-xl font-extrabold text-amber-600 mt-0.5">
              {users.filter(u => u.status === 'pending_verification' || !u.isVerifiedBadge).length}
            </p>
          </div>
          <Award className="w-6 h-6 text-amber-500 opacity-80" />
        </div>

        <div className="p-2.5 sm:p-3 bg-surface rounded-xl neo-outset flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Active Accounts</span>
            <p className="text-lg sm:text-xl font-extrabold text-emerald-600 mt-0.5">
              {users.filter(u => u.status === 'active').length}
            </p>
          </div>
          <CheckCircle className="w-6 h-6 text-emerald-500 opacity-80" />
        </div>
      </div>

      <div className="flex items-center gap-2.5 bg-[var(--color-surface)] p-2.5 rounded-xl neo-outset shrink-0">
        <form onSubmit={handleSearchSubmit} className="flex-1 flex items-center bg-[var(--color-surface-container)] rounded-lg px-3 py-1.5 neo-inset">
          <Search className="w-4 h-4 text-[var(--color-on-surface-variant)]" />
          <input
            type="text"
            placeholder="Search by real name, secret name, college, or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none px-2.5 py-0.5 text-xs text-[var(--color-on-surface)] placeholder-[var(--color-on-surface-variant)]"
          />
        </form>
        <div className="flex items-center gap-2 bg-[var(--color-surface-container)] rounded-lg px-3 py-1.5 neo-inset">
          <Filter className="w-4 h-4 text-[var(--color-on-surface-variant)]" />
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-transparent border-none outline-none text-xs font-bold text-[var(--color-on-surface)] cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="pending_verification">Pending Verification</option>
          </select>
        </div>
      </div>

      {/* Main Expanded User Directory Workspace (Occupying 70-75% of available viewport) */}
      <div className="flex-1 min-h-[520px] lg:min-h-[580px] neo-outset flex flex-col rounded-3xl overflow-hidden shadow-xs bg-surface">
        <div className="px-5 py-3.5 border-b border-[var(--color-surface-variant)] flex justify-between items-center bg-surface shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-[var(--color-primary)]">Expanded User Directory ({users.length})</h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 bg-[var(--color-primary-fixed)] text-[var(--color-primary)] rounded-md">
              Live Supabase DB
            </span>
          </div>
          <span className="text-xs text-on-surface-variant font-medium">Click any card or "Manage" to open control drawer</span>
        </div>
        
        {loading ? (
          <div className="flex-1 flex items-center justify-center text-[var(--color-on-surface-variant)] animate-pulse text-sm font-semibold">
            Loading student user directory...
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-[var(--color-error)] font-bold text-sm">Failed to load: {error}</div>
        ) : users.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--color-on-surface-variant)] p-8 text-center">
            <User className="w-12 h-12 opacity-30 mb-2" />
            <p className="text-sm font-bold">No students found matching current filters.</p>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto neo-inset m-3 p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 rounded-2xl auto-rows-max">
            {users.map(user => (
              <div 
                key={user.id} 
                className="bg-white/85 hover:bg-white transition-all p-5 sm:p-6 rounded-2xl border border-white/80 shadow-xs flex flex-col justify-between gap-4 cursor-pointer hover:shadow-md group min-h-[290px]"
                onClick={() => {
                  setSelectedUser(user);
                  setIsEditing(false);
                }}
              >
                <div>
                  {/* Top Header: Avatar + Anonymous Handle + Verified + Status Badge */}
                  <div className="flex items-start justify-between gap-3 mb-3.5">
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 neo-outset rounded-2xl overflow-hidden flex items-center justify-center font-bold text-lg text-[var(--color-primary)] bg-[var(--color-surface)] relative flex-shrink-0 border-2 border-primary/20">
                        {user.capturedIdImage ? (
                          <img src={user.capturedIdImage} alt={user.secretName} className="w-full h-full object-cover" />
                        ) : (
                          <img
                            src={`https://api.dicebear.com/7.x/fun-emoji/svg?seed=${user.secretName}&backgroundColor=ffd5dc`}
                            alt={user.secretName}
                            className="w-full h-full object-cover"
                          />
                        )}
                        {user.isVerifiedBadge && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-white text-[10px] font-bold shadow-md">
                            ✓
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h3 className="text-base font-bold text-on-surface truncate">@{user.secretName}</h3>
                          {user.isVerifiedBadge && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                              ✓ Verified
                            </span>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-on-surface-variant truncate mt-0.5">
                          {user.name ? user.name : <span className="italic opacity-60">No real name set</span>}
                        </p>
                      </div>
                    </div>

                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                      user.status === 'active' ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                      user.status === 'suspended' ? 'bg-rose-100 text-rose-900 border border-rose-300' :
                      'bg-amber-100 text-amber-900 border border-amber-300'
                    }`}>
                      {user.status.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Academic & Contact Details Pills */}
                  <div className="space-y-2 text-xs bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/40">
                    <div className="flex items-center justify-between text-on-surface font-medium truncate">
                      <span className="text-on-surface-variant text-[11px]">🏫 College:</span>
                      <span className="font-bold truncate max-w-[170px]">{user.college || "Arya (MAIN), kukas"}</span>
                    </div>

                    <div className="flex items-center justify-between text-on-surface font-medium">
                      <span className="text-on-surface-variant text-[11px]">💻 Branch & Sem:</span>
                      <span className="font-bold">
                        {user.branch || "CS"} • Sem {user.semester || "1"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-on-surface font-medium truncate">
                      <span className="text-on-surface-variant text-[11px]">📧 Email:</span>
                      <span className="font-semibold text-primary truncate max-w-[170px]">{user.email}</span>
                    </div>

                    {user.mobile && (
                      <div className="flex items-center justify-between text-on-surface font-medium">
                        <span className="text-on-surface-variant text-[11px]">📱 Mobile:</span>
                        <span className="font-bold">{user.mobile}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Direct Action Buttons */}
                <div className="pt-2.5 border-t border-outline-variant/30 flex items-center justify-between gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleBadge(user);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                      user.isVerifiedBadge
                        ? "bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                        : "bg-surface text-on-surface hover:bg-primary/10 hover:text-primary border border-outline-variant/50"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{user.isVerifiedBadge ? "Badge Active" : "Grant Badge"}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateStatus(user.id, user.status === 'active' ? 'suspended' : 'active');
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        user.status === 'active'
                          ? "text-rose-700 hover:bg-rose-50"
                          : "text-emerald-700 hover:bg-emerald-50"
                      }`}
                    >
                      {user.status === 'active' ? "Suspend" : "Activate"}
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedUser(user);
                        setIsEditing(false);
                      }}
                      className="neo-button px-3.5 py-1.5 text-xs font-bold text-[var(--color-primary)] rounded-xl cursor-pointer"
                    >
                      Manage
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* User Details Drawer */}
      {selectedUser && (
        <div className="absolute inset-y-0 right-0 w-96 bg-[var(--color-surface)] neo-outset rounded-l-3xl p-6 overflow-auto z-10 animate-in slide-in-from-right-10 border-l border-[var(--color-surface-variant)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-[var(--color-on-background)]">User Control Drawer</h3>
              <button onClick={() => setSelectedUser(null)} className="p-2 rounded-full hover:bg-[var(--color-surface-container)] text-[var(--color-on-surface-variant)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {!isEditing ? (
              <div className="space-y-6">
                <div className="p-4 bg-white/50 rounded-2xl space-y-3 border border-white/60">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-[var(--color-on-surface-variant)] font-bold uppercase">Secret Name</span>
                      <p className="font-bold text-sm text-[var(--color-primary)]">{selectedUser.secretName}</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setEditForm({
                          name: selectedUser.name,
                          secretName: selectedUser.secretName,
                          email: selectedUser.email,
                          semester: selectedUser.semester
                        });
                      }}
                      className="neo-button px-2.5 py-1 text-xs font-bold text-[var(--color-primary)] flex items-center gap-1"
                    >
                      <Edit3 className="w-3 h-3" /> Edit
                    </button>
                  </div>
                  <div><span className="text-[10px] text-[var(--color-on-surface-variant)] font-bold uppercase">Real Name</span><p className="text-xs font-semibold">{selectedUser.name}</p></div>
                  <div><span className="text-[10px] text-[var(--color-on-surface-variant)] font-bold uppercase">Email</span><p className="text-xs font-semibold">{selectedUser.email}</p></div>
                  <div><span className="text-[10px] text-[var(--color-on-surface-variant)] font-bold uppercase">Mobile</span><p className="text-xs font-semibold">{selectedUser.mobile}</p></div>
                  <div><span className="text-[10px] text-[var(--color-on-surface-variant)] font-bold uppercase">Semester / Branch</span><p className="text-xs font-semibold">Sem {selectedUser.semester} {selectedUser.branch ? `- ${selectedUser.branch}` : ''}</p></div>
                  <div>
                    <span className="text-[10px] text-[var(--color-on-surface-variant)] font-bold uppercase mb-1 block">Account Status</span>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                      selectedUser.status === 'active' ? 'bg-green-100 text-green-800' :
                      selectedUser.status === 'suspended' ? 'bg-[#ffdad6] text-[#ba1a1a]' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedUser.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-[var(--color-on-surface-variant)] uppercase mb-2">ID Verification Image</h4>
                  {selectedUser.capturedIdImage ? (
                    <div className="neo-inset p-2 rounded-xl bg-[var(--color-surface)]">
                      <img src={selectedUser.capturedIdImage} alt="ID" className="w-full h-auto rounded-lg" />
                    </div>
                  ) : (
                    <div className="p-3 bg-[var(--color-surface-container)] rounded-xl text-center text-xs text-[var(--color-on-surface-variant)] font-medium">
                      No ID card document uploaded.
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <h4 className="font-bold text-sm text-[var(--color-primary)]">Edit Profile Information</h4>
                <div>
                  <label className="text-xs font-bold text-[var(--color-on-surface-variant)]">Secret Name</label>
                  <input
                    type="text"
                    value={editForm.secretName || ''}
                    onChange={e => setEditForm({ ...editForm, secretName: e.target.value })}
                    className="w-full neo-inset p-2.5 rounded-xl text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--color-on-surface-variant)]">Real Name</label>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full neo-inset p-2.5 rounded-xl text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--color-on-surface-variant)]">Email</label>
                  <input
                    type="email"
                    value={editForm.email || ''}
                    onChange={e => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full neo-inset p-2.5 rounded-xl text-xs mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[var(--color-on-surface-variant)]">Semester</label>
                  <input
                    type="text"
                    value={editForm.semester || ''}
                    onChange={e => setEditForm({ ...editForm, semester: e.target.value })}
                    className="w-full neo-inset p-2.5 rounded-xl text-xs mt-1"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="button" onClick={() => setIsEditing(false)} className="flex-1 py-2 neo-button rounded-xl text-xs font-bold text-[var(--color-on-surface-variant)]">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 py-2 neo-button rounded-xl text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary-fixed)]">
                    Save Changes
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="space-y-2 pt-4 border-t border-[var(--color-surface-variant)]">
            <button
              onClick={() => handleToggleBadge(selectedUser)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl neo-button text-xs font-bold text-blue-800 bg-blue-50"
            >
              <Award className="w-4 h-4" /> {selectedUser.isVerifiedBadge ? 'Revoke Verified Badge' : 'Grant Verified Badge'}
            </button>

            {selectedUser.status !== 'active' && (
              <button
                onClick={() => updateStatus(selectedUser.id, 'active')}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl neo-button text-xs font-bold text-green-800 bg-green-50"
              >
                <ShieldCheck className="w-4 h-4" /> Approve / Reactivate
              </button>
            )}
            {selectedUser.status !== 'suspended' && (
              <button
                onClick={() => updateStatus(selectedUser.id, 'suspended')}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl neo-button text-xs font-bold text-[#ba1a1a] bg-[#ffdad6]"
              >
                <Ban className="w-4 h-4" /> Suspend User
              </button>
            )}
            {isSuperAdmin && (
              <button
                onClick={async () => {
                  const newRole = !selectedUser.isAdmin;
                  if (!window.confirm(`Are you sure you want to ${newRole ? 'PROMOTE' : 'DEMOTE'} this user ${newRole ? 'to Admin' : 'from Admin'}?`)) return;
                  await api.promoteUser(selectedUser.id, newRole);
                  setSelectedUser({ ...selectedUser, isAdmin: newRole });
                  fetchUsers();
                }}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl neo-button text-xs font-bold ${
                  selectedUser.isAdmin ? 'text-amber-800 bg-amber-50' : 'text-purple-800 bg-purple-50'
                }`}
              >
                <Award className="w-4 h-4" /> {selectedUser.isAdmin ? 'Demote from Admin' : 'Promote to Admin (Staff)'}
              </button>
            )}

            <button
              onClick={() => handleDeleteUser(selectedUser.id)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl neo-button text-xs font-bold text-white bg-[#ba1a1a]"
            >
              <Trash2 className="w-4 h-4" /> Terminate / Delete Account Permanently
            </button>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="neo-outset bg-[var(--color-surface)] p-6 rounded-3xl max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-[var(--color-primary)]">Create User Account</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--color-on-surface-variant)]">Real Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full neo-inset p-3 rounded-xl text-xs mt-1"
                  placeholder="e.g. Alex Rivera"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--color-on-surface-variant)]">Secret Handle / Name</label>
                <input
                  type="text"
                  required
                  value={newSecretName}
                  onChange={e => setNewSecretName(e.target.value)}
                  className="w-full neo-inset p-3 rounded-xl text-xs mt-1"
                  placeholder="e.g. Phoenix_99"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--color-on-surface-variant)]">College Email</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="w-full neo-inset p-3 rounded-xl text-xs mt-1"
                  placeholder="e.g. alex@college.edu"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--color-on-surface-variant)]">Semester</label>
                <input
                  type="text"
                  value={newSemester}
                  onChange={e => setNewSemester(e.target.value)}
                  className="w-full neo-inset p-3 rounded-xl text-xs mt-1"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2 neo-button rounded-xl text-xs font-bold text-[var(--color-on-surface-variant)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 neo-button rounded-xl text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary-fixed)]"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


