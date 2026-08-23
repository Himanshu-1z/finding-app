import React, { useState, useEffect } from 'react';
import { Shield, Key, Users, AlertTriangle, Radio, Activity, Lock, CheckCircle, RefreshCw, UserPlus, Power, FileText } from 'lucide-react';
import { api } from '../services/api';
import { SystemSettings, StaffAdmin, AuditLog } from '../types/models';

export default function Settings() {
  const [activeTab, setActiveTab] = useState<'system' | 'staff' | 'audit'>('system');
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [staff, setStaff] = useState<StaffAdmin[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  // Add Staff Admin Modal
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<StaffAdmin['role']>('Senior Moderator');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [sysSettings, staffList, logs] = await Promise.all([
        api.getSystemSettings(),
        api.getStaffAdmins(),
        api.getAuditLogs()
      ]);
      setSettings(sysSettings);
      setStaff(staffList);
      setAuditLogs(logs);
    } catch (err) {
      console.error('Failed to load system settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSetting = async (key: keyof SystemSettings) => {
    if (!settings) return;
    const updatedValue = !settings[key as keyof SystemSettings];
    setSaving(true);
    try {
      const updated = await api.updateSystemSettings({ [key]: updatedValue });
      setSettings(updated);
      setMessage(`Updated ${String(key)} successfully.`);
      setTimeout(() => setMessage(''), 3000);
      const logs = await api.getAuditLogs();
      setAuditLogs(logs);
    } catch (err) {
      alert('Failed to update setting');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateBroadcast = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await api.updateSystemSettings({
        broadcastMessage: settings.broadcastMessage,
        broadcastActive: settings.broadcastActive
      });
      setSettings(updated);
      setMessage('Broadcast configuration updated!');
      setTimeout(() => setMessage(''), 3000);
      const logs = await api.getAuditLogs();
      setAuditLogs(logs);
    } catch (err) {
      alert('Failed to update broadcast');
    } finally {
      setSaving(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminName || !newAdminEmail) return;
    setSaving(true);
    try {
      await api.addStaffAdmin({ name: newAdminName, email: newAdminEmail, role: newAdminRole });
      setShowAddAdminModal(false);
      setNewAdminName('');
      setNewAdminEmail('');
      setMessage('New staff admin successfully onboarded!');
      setTimeout(() => setMessage(''), 3000);
      const [staffList, logs] = await Promise.all([api.getStaffAdmins(), api.getAuditLogs()]);
      setStaff(staffList);
      setAuditLogs(logs);
    } catch (err) {
      alert('Failed to add staff admin');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStaffStatus = async (id: string, currentStatus: 'active' | 'inactive') => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await api.toggleStaffAdminStatus(id, nextStatus);
      const [staffList, logs] = await Promise.all([api.getStaffAdmins(), api.getAuditLogs()]);
      setStaff(staffList);
      setAuditLogs(logs);
    } catch (err) {
      alert('Failed to toggle status');
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-300 h-full flex flex-col min-h-0">
      <header className="flex justify-between items-start shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 text-[10px] font-bold uppercase bg-[#ffdad6] text-[#ba1a1a] rounded-md tracking-wider">
              Super Admin Mode
            </span>
            <span className="text-xs text-[var(--color-on-surface-variant)]">Root Privileges Granted</span>
          </div>
          <h2 className="text-2xl font-bold text-[var(--color-on-background)] mt-0.5">Super Admin Control Center</h2>
          <p className="text-[var(--color-on-surface-variant)] font-medium text-xs">Full administrative authority over global settings, staff roles, and live audit streams.</p>
        </div>

        {/* Tab Navigation Buttons */}
        <div className="neo-outset p-1 flex gap-1 rounded-2xl bg-surface">
          <button
            onClick={() => setActiveTab('system')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'system'
                ? 'bg-[var(--color-primary-fixed)] text-[var(--color-primary)] shadow-xs'
                : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]'
            }`}
          >
            <Power className="w-3.5 h-3.5" /> System Controls
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'staff'
                ? 'bg-[var(--color-primary-fixed)] text-[var(--color-primary)] shadow-xs'
                : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Staff & RBAC
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-[var(--color-primary-fixed)] text-[var(--color-primary)] shadow-xs'
                : 'text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> Live Audit Trail
          </button>
        </div>
      </header>

      {message && (
        <div className="p-3 bg-green-100 border border-green-300 text-green-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in shrink-0">
          <CheckCircle className="w-4 h-4" /> {message}
        </div>
      )}

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-[var(--color-on-surface-variant)] animate-pulse font-bold text-sm">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Initializing Super Admin Console...
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col">
          {/* TAB 1: SYSTEM CONTROLS */}
          {activeTab === 'system' && settings && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full overflow-y-auto pr-1">
              {/* Emergency & Maintenance Switches */}
              <div className="neo-outset p-5 space-y-4 rounded-3xl bg-surface">
                <div className="flex items-center gap-3 border-b border-[var(--color-surface-variant)] pb-4">
                  <div className="p-3 neo-inset rounded-xl text-[#ba1a1a]">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--color-on-background)]">Emergency & System State</h3>
                    <p className="text-xs text-[var(--color-on-surface-variant)]">Toggle platform accessibility and kill switches instantly.</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Maintenance Mode */}
                  <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                    settings.maintenanceMode ? 'bg-[#ffdad6]/40 border-[#ba1a1a]' : 'bg-white/40 border-[var(--color-surface-variant)]'
                  }`}>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-[var(--color-on-surface)]">Global Maintenance Mode</h4>
                        {settings.maintenanceMode && <span className="text-[10px] bg-[#ba1a1a] text-white px-2 py-0.5 rounded font-bold uppercase">ACTIVE</span>}
                      </div>
                      <p className="text-xs text-[var(--color-on-surface-variant)]">Displays maintenance banner to users and blocks non-admin actions.</p>
                    </div>
                    <button
                      onClick={() => handleToggleSetting('maintenanceMode')}
                      disabled={saving}
                      className={`neo-button px-4 py-2 text-xs font-bold rounded-xl ${
                        settings.maintenanceMode ? 'bg-[#ba1a1a] text-white' : 'text-[var(--color-primary)]'
                      }`}
                    >
                      {settings.maintenanceMode ? 'Disable' : 'Enable'}
                    </button>
                  </div>

                  {/* Read Only Mode */}
                  <div className="p-4 bg-white/40 rounded-2xl border border-[var(--color-surface-variant)] flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-[var(--color-on-surface)]">Emergency Read-Only Mode</h4>
                      <p className="text-xs text-[var(--color-on-surface-variant)]">Prevents new confession submissions and chat messages.</p>
                    </div>
                    <button
                      onClick={() => handleToggleSetting('readOnlyMode')}
                      disabled={saving}
                      className={`neo-button px-4 py-2 text-xs font-bold rounded-xl ${
                        settings.readOnlyMode ? 'bg-[#ba1a1a] text-white' : 'text-[var(--color-primary)]'
                      }`}
                    >
                      {settings.readOnlyMode ? 'Disable' : 'Enable'}
                    </button>
                  </div>

                  {/* Allow Registrations */}
                  <div className="p-4 bg-white/40 rounded-2xl border border-[var(--color-surface-variant)] flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-[var(--color-on-surface)]">New User Signups</h4>
                      <p className="text-xs text-[var(--color-on-surface-variant)]">Allow students to create new Finding accounts.</p>
                    </div>
                    <button
                      onClick={() => handleToggleSetting('allowRegistrations')}
                      disabled={saving}
                      className={`neo-button px-4 py-2 text-xs font-bold rounded-xl ${
                        settings.allowRegistrations ? 'text-green-700 bg-green-100' : 'text-[#ba1a1a] bg-[#ffdad6]'
                      }`}
                    >
                      {settings.allowRegistrations ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Broadcast & Moderation Engine */}
              <div className="neo-outset p-6 space-y-6">
                <div className="flex items-center gap-3 border-b border-[var(--color-surface-variant)] pb-4">
                  <div className="p-3 neo-inset rounded-xl text-[var(--color-primary)]">
                    <Radio className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--color-on-background)]">System Broadcast & AI Mod</h3>
                    <p className="text-xs text-[var(--color-on-surface-variant)]">Broadcast global notifications and configure AI moderation.</p>
                  </div>
                </div>

                {/* Broadcast Banner Control */}
                <div className="p-4 bg-white/40 rounded-2xl border border-[var(--color-surface-variant)] space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="font-bold text-sm text-[var(--color-on-surface)]">Global Admin Broadcast Message</label>
                    <button
                      onClick={() => setSettings({ ...settings, broadcastActive: !settings.broadcastActive })}
                      className={`text-[10px] font-bold px-2 py-1 rounded ${
                        settings.broadcastActive ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      {settings.broadcastActive ? 'Active on User App' : 'Inactive'}
                    </button>
                  </div>
                  <textarea
                    value={settings.broadcastMessage}
                    onChange={e => setSettings({ ...settings, broadcastMessage: e.target.value })}
                    className="w-full neo-inset p-3 rounded-xl text-xs font-medium focus:outline-none"
                    rows={2}
                    placeholder="Type global alert message..."
                  />
                  <button
                    onClick={handleUpdateBroadcast}
                    disabled={saving}
                    className="neo-button px-4 py-2 text-xs font-bold text-[var(--color-primary)] w-full"
                  >
                    Update Broadcast Banner
                  </button>
                </div>

                {/* Auto Mod Sensitivity */}
                <div className="p-4 bg-white/40 rounded-2xl border border-[var(--color-surface-variant)] space-y-2">
                  <h4 className="font-bold text-sm text-[var(--color-on-surface)]">Auto-Moderation Sensitivity</h4>
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {(['strict', 'balanced', 'off'] as const).map(sens => (
                      <button
                        key={sens}
                        onClick={async () => {
                          const updated = await api.updateSystemSettings({ autoModSensitivity: sens });
                          setSettings(updated);
                        }}
                        className={`neo-button py-2 text-xs font-bold capitalize ${
                          settings.autoModSensitivity === sens ? 'bg-[var(--color-primary-fixed)] text-[var(--color-primary)] font-extrabold' : ''
                        }`}
                      >
                        {sens}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STAFF ADMINS & RBAC */}
          {activeTab === 'staff' && (
            <div className="neo-outset p-6 flex flex-col h-full space-y-4">
              <div className="flex justify-between items-center border-b border-[var(--color-surface-variant)] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-primary)]">Staff Administrators & RBAC</h3>
                  <p className="text-xs text-[var(--color-on-surface-variant)]">Manage staff team credentials, permissions, and status.</p>
                </div>
                <button
                  onClick={() => setShowAddAdminModal(true)}
                  className="neo-button px-4 py-2 text-xs font-bold text-[var(--color-primary)] flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" /> Add Staff Admin
                </button>
              </div>

              <div className="flex-1 neo-inset p-4 overflow-y-auto space-y-3">
                {staff.map(adm => (
                  <div key={adm.id} className="bg-white/50 p-4 rounded-2xl flex items-center justify-between border border-white/60">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 neo-outset flex items-center justify-center font-bold text-[var(--color-primary)]">
                        {adm.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-[var(--color-on-background)]">{adm.name}</p>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[var(--color-primary-fixed)] text-[var(--color-primary)]">
                            {adm.role}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--color-on-surface-variant)]">{adm.email} • Last active: {adm.lastLogin}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                        adm.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {adm.status.toUpperCase()}
                      </span>
                      {adm.role !== 'Super Admin' && (
                        <button
                          onClick={() => handleToggleStaffStatus(adm.id, adm.status)}
                          className="neo-button px-3 py-1.5 text-xs font-bold text-[var(--color-primary)]"
                        >
                          {adm.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: LIVE AUDIT TRAIL */}
          {activeTab === 'audit' && (
            <div className="neo-outset p-6 flex flex-col h-full space-y-4">
              <div className="flex justify-between items-center border-b border-[var(--color-surface-variant)] pb-4">
                <div>
                  <h3 className="text-lg font-bold text-[var(--color-primary)]">System Audit Trail</h3>
                  <p className="text-xs text-[var(--color-on-surface-variant)]">Immutable live log of administrative actions and security events.</p>
                </div>
                <button onClick={loadData} className="neo-button px-3 py-1.5 text-xs font-bold text-[var(--color-primary)] flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Refresh Logs
                </button>
              </div>

              <div className="flex-1 neo-inset p-4 overflow-y-auto space-y-2 font-mono text-xs">
                {auditLogs.map(log => (
                  <div key={log.id} className="bg-white/40 p-3 rounded-xl flex items-center justify-between border border-white/60">
                    <div className="flex items-center gap-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        log.type === 'security' ? 'bg-red-100 text-red-800' :
                        log.type === 'user' ? 'bg-blue-100 text-blue-800' :
                        log.type === 'content' ? 'bg-amber-100 text-amber-800' : 'bg-gray-200 text-gray-800'
                      }`}>
                        {log.type}
                      </span>
                      <div>
                        <span className="font-bold text-[var(--color-primary)]">{log.adminName}</span>
                        <span className="text-[var(--color-on-background)] ml-2">{log.action}</span>
                        <span className="text-[var(--color-on-surface-variant)] ml-2 font-normal">→ {log.target}</span>
                      </div>
                    </div>
                    <span className="opacity-60 text-[10px]">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Staff Admin Modal */}
      {showAddAdminModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="neo-outset bg-[var(--color-surface)] p-6 rounded-3xl max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-[var(--color-primary)]">Add Staff Administrator</h3>
            <form onSubmit={handleAddStaff} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[var(--color-on-surface-variant)]">Full Name</label>
                <input
                  type="text"
                  required
                  value={newAdminName}
                  onChange={e => setNewAdminName(e.target.value)}
                  className="w-full neo-inset p-3 rounded-xl text-xs mt-1"
                  placeholder="e.g. Sarah Jenkins"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--color-on-surface-variant)]">Staff Email</label>
                <input
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={e => setNewAdminEmail(e.target.value)}
                  className="w-full neo-inset p-3 rounded-xl text-xs mt-1"
                  placeholder="e.g. sarah.j@finding.app"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[var(--color-on-surface-variant)]">Role & Access Level</label>
                <select
                  value={newAdminRole}
                  onChange={e => setNewAdminRole(e.target.value as StaffAdmin['role'])}
                  className="w-full neo-inset p-3 rounded-xl text-xs mt-1 font-bold"
                >
                  <option value="Senior Moderator">Senior Moderator (User & Confession Moderate)</option>
                  <option value="Content Auditor">Content Auditor (Audit & Read Only)</option>
                  <option value="Support Staff">Support Staff (Chats & User Verification)</option>
                  <option value="Super Admin">Super Admin (Full Power)</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddAdminModal(false)}
                  className="flex-1 py-2 neo-button rounded-xl text-xs font-bold text-[var(--color-on-surface-variant)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 neo-button rounded-xl text-xs font-bold text-[var(--color-primary)] bg-[var(--color-primary-fixed)]"
                >
                  Create Staff Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}


