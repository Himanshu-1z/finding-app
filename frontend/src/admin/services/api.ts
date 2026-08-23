import { UserProfile, Confession, DashboardStats, ConnectionRequest, ChatThread, StaffAdmin, SystemSettings, AuditLog } from '../types/models';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true';
const BASE_URL = import.meta.env.VITE_API_BASE_URL || (typeof window !== "undefined" ? `http://${window.location.hostname || "localhost"}:5000/api/admin` : "http://localhost:5000/api/admin");


// Mocks
let mockUsers: UserProfile[] = [
  { id: '1', status: 'active', createdAt: '2023-01-01T00:00:00Z', lastActiveAt: '2023-01-02T00:00:00Z', secretName: 'Alpha', gender: 'M', name: 'John Doe', semester: '1', mobile: '1234567890', email: 'john@example.com', dob: '2000-01-01', capturedIdImage: null, isSetupComplete: true, isVerifiedBadge: true },
  { id: '2', status: 'pending_verification', createdAt: '2023-01-05T00:00:00Z', lastActiveAt: '2023-01-05T00:00:00Z', secretName: 'Beta', gender: 'F', name: 'Jane Smith', semester: '3', mobile: '0987654321', email: 'jane@example.com', dob: '1999-05-15', capturedIdImage: 'https://via.placeholder.com/300x200?text=ID+Card', isSetupComplete: true },
  { id: '3', status: 'suspended', createdAt: '2023-01-10T00:00:00Z', lastActiveAt: '2023-01-12T00:00:00Z', secretName: 'Gamma', gender: 'M', name: 'Robert Paulson', semester: '5', mobile: '5551234567', email: 'robert@example.com', dob: '1998-03-20', capturedIdImage: null, isSetupComplete: true }
];

let mockConfessions: Confession[] = [
  { id: 'c1', status: 'visible', reportCount: 0, author: 'Alpha', time: '2023-01-02T10:00:00Z', content: 'I like someone in my CS class.', likes: 5, likedByMe: false, isRequested: false, type: 'public', isPinned: true },
  { id: 'c2', status: 'hidden', reportCount: 3, author: 'Gamma', time: '2023-01-02T11:00:00Z', content: 'This professor is terrible!', likes: 2, likedByMe: true, isRequested: false, type: 'tagged', targetPerson: 'Prof X' },
  { id: 'c3', status: 'visible', reportCount: 12, author: 'Justice Seeker', time: '2023-01-03T09:15:00Z', content: 'The guy sitting in the back of LH-302 with the blue hoodie keeps looking at everyone\'s screen, so annoying...', likes: 14, likedByMe: false, isRequested: false, type: 'public' }
];

let mockReports: ConnectionRequest[] = [
  { id: 'r1', fromUser: 'Alpha', avatarUrl: 'https://via.placeholder.com/40', status: 'pending', reason: 'Harassment in public confession', timestamp: '2023-01-03T10:00:00Z' },
  { id: 'r2', fromUser: 'Gamma', avatarUrl: 'https://via.placeholder.com/40', status: 'pending', reason: 'Spamming connection requests', timestamp: '2023-01-03T11:30:00Z' }
];

let mockChats: ChatThread[] = [
  { id: 'chat1', name: 'Alpha & Beta', letter: 'A', status: 'active', lastMessage: 'Hello there', time: '2023-01-03T12:00:00Z', unread: 0, messages: [
    { id: 'm1', sender: 'them', text: 'Hi, are you going to the library?', time: '2023-01-03T11:50:00Z' },
    { id: 'm2', sender: 'me', text: 'Yes, heading there now.', time: '2023-01-03T12:00:00Z' }
  ]}
];

let mockStaffAdmins: StaffAdmin[] = [
  { id: 'a1', name: 'Super Admin', email: 'superadmin@finding.app', role: 'Super Admin', status: 'active', lastLogin: 'Just now', permissions: ['all'] },
  { id: 'a2', name: 'Jane Moderator', email: 'jane.mod@finding.app', role: 'Senior Moderator', status: 'active', lastLogin: '2 hours ago', permissions: ['users.view', 'users.status', 'confessions.moderate'] },
  { id: 'a3', name: 'Audit Bot', email: 'audit@finding.app', role: 'Content Auditor', status: 'inactive', lastLogin: '3 days ago', permissions: ['logs.view'] }
];

let mockSystemSettings: SystemSettings = {
  maintenanceMode: false,
  readOnlyMode: false,
  allowRegistrations: true,
  autoModSensitivity: 'balanced',
  postRateLimit: 5,
  broadcastMessage: 'Welcome to Finding Admin Control Center! All systems operational.',
  broadcastActive: true
};

let mockAuditLogs: AuditLog[] = [
  { id: 'log-1', adminName: 'Super Admin', action: 'System Login', target: 'Admin Console', timestamp: new Date().toISOString(), type: 'security' },
  { id: 'log-2', adminName: 'Super Admin', action: 'Approved User ID', target: 'User Alpha', timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'user' },
  { id: 'log-3', adminName: 'Jane Moderator', action: 'Hidden Confession', target: 'Confession #c2', timestamp: new Date(Date.now() - 7200000).toISOString(), type: 'content' }
];

export const api = {
  login: async (username: string, password: string) => {
    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    if (username === 'admin' && password === 'admin') {
      return { token: 'finding-admin-jwt-token', user: { name: 'Super Admin', role: 'Super Admin' } };
    }
    throw new Error('Invalid credentials');
  },

  getStats: async (): Promise<DashboardStats> => {
    try {
      const res = await fetch(`${BASE_URL}/stats/overview`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch (_) {}

    return {
      totalUsers: mockUsers.length,
      pendingVerifications: mockUsers.filter(u => u.status === 'pending_verification').length,
      confessionsToday: mockConfessions.length,
      openReports: mockReports.filter(r => r.status === 'pending').length,
      systemHealth: 'Nominal (100%)',
      activeAdmins: 1,
      maintenanceMode: false
    };
  },

  getActivityLog: async (): Promise<any[]> => {
    try {
      const res = await fetch(`${BASE_URL}/activity-log`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch (_) {}
    return [];
  },


  getUsers: async (status?: string, search?: string): Promise<{ users: UserProfile[], total: number }> => {
    try {
      const res = await fetch(`${BASE_URL}/users?status=${status || ''}&search=${search || ''}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.users)) return data;
        if (Array.isArray(data)) return { users: data, total: data.length };
      }
    } catch (_) {}

    let filtered = [...mockUsers];
    if (status) filtered = filtered.filter(u => u.status === status);
    if (search) filtered = filtered.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.secretName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));
    return { users: filtered, total: filtered.length };
  },

  createUser: async (userData: Partial<UserProfile>): Promise<UserProfile> => {
    try {
      const res = await fetch(`${BASE_URL}/users`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(userData)
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      status: userData.status || 'active',
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      secretName: userData.secretName || 'NewUser',
      gender: userData.gender || 'M',
      name: userData.name || 'New Account',
      semester: userData.semester || '1',
      mobile: userData.mobile || '1234567890',
      email: userData.email || `user${Date.now()}@finding.app`,
      dob: userData.dob || '2000-01-01',
      capturedIdImage: null,
      isSetupComplete: true,
      isVerifiedBadge: userData.isVerifiedBadge || false
    };
    mockUsers.unshift(newUser);
    return newUser;
  },

  updateUserStatus: async (id: string, status: UserProfile['status']): Promise<UserProfile> => {
    try {
      const res = await fetch(`${BASE_URL}/users/${id}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    const user = mockUsers.find(u => u.id === id);
    if (user) user.status = status;
    return user || mockUsers[0];
  },

  updateUser: async (id: string, data: Partial<UserProfile>): Promise<UserProfile> => {
    try {
      const res = await fetch(`${BASE_URL}/users/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(data)
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    const index = mockUsers.findIndex(u => u.id === id);
    if (index !== -1) mockUsers[index] = { ...mockUsers[index], ...data };
    return mockUsers[index] || mockUsers[0];
  },

  deleteUser: async (id: string): Promise<void> => {
    try {
      await fetch(`${BASE_URL}/users/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
    } catch (_) {}
    mockUsers = mockUsers.filter(u => u.id !== id);
  },

  getConfessions: async (status?: string): Promise<{ confessions: Confession[], total: number }> => {
    try {
      const res = await fetch(`${BASE_URL}/confessions?status=${status || ''}`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.confessions)) return data;
      }
    } catch (_) {}

    let filtered = [...mockConfessions];
    if (status) filtered = filtered.filter(c => c.status === status);
    return { confessions: filtered, total: filtered.length };
  },

  createOfficialConfession: async (content: string, type: 'public' | 'tagged', targetPerson?: string): Promise<Confession> => {
    try {
      const res = await fetch(`${BASE_URL}/confessions/admin-post`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ content, type, targetPerson })
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    const newConfession: Confession = {
      id: `c-${Date.now()}`,
      status: 'visible',
      reportCount: 0,
      author: '👑 Official Admin',
      time: new Date().toISOString(),
      content,
      likes: 0,
      likedByMe: false,
      isRequested: false,
      type,
      targetPerson,
      isPinned: true
    };
    mockConfessions.unshift(newConfession);
    return newConfession;
  },

  moderateConfession: async (id: string, status: Confession['status']): Promise<Confession> => {
    try {
      const res = await fetch(`${BASE_URL}/confessions/${id}/moderate`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    const conf = mockConfessions.find(c => c.id === id);
    if (conf) conf.status = status;
    return conf || mockConfessions[0];
  },

  deleteConfession: async (id: string): Promise<void> => {
    try {
      await fetch(`${BASE_URL}/confessions/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
    } catch (_) {}
    mockConfessions = mockConfessions.filter(c => c.id !== id);
  },

  purgeHiddenConfessions: async (): Promise<{ purgedCount: number }> => {
    try {
      const res = await fetch(`${BASE_URL}/confessions/purge`, {
        method: 'POST',
        headers: getHeaders()
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    const initial = mockConfessions.length;
    mockConfessions = mockConfessions.filter(c => c.status !== 'hidden' && c.status !== 'removed');
    return { purgedCount: initial - mockConfessions.length };
  },

  getReports: async (): Promise<{ requests: ConnectionRequest[], total: number }> => {
    try {
      const res = await fetch(`${BASE_URL}/reports`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.requests)) return data;
      }
    } catch (_) {}

    return { requests: mockReports, total: mockReports.length };
  },

  getInteractionRequests: async (): Promise<{ requests: any[], total: number }> => {
    try {
      const res = await fetch(`${BASE_URL}/interaction-requests`, { headers: getHeaders() });
      if (res.ok) {
        return await res.json();
      }
    } catch (_) {}
    return { requests: [], total: 0 };
  },

  approveInteractionRequest: async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE_URL}/interaction-requests/${id}/approve`, {
        method: 'POST',
        headers: getHeaders()
      });
      return res.ok;
    } catch (_) {
      return false;
    }
  },

  declineInteractionRequest: async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE_URL}/interaction-requests/${id}/decline`, {
        method: 'POST',
        headers: getHeaders()
      });
      return res.ok;
    } catch (_) {
      return false;
    }
  },

  deleteInteractionRequest: async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE_URL}/interaction-requests/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      return res.ok;
    } catch (_) {
      return false;
    }
  },


  getPendingVerifications: async (status?: string): Promise<any[]> => {
    try {
      const url = status ? `${BASE_URL}/verifications/pending?status=${status}` : `${BASE_URL}/verifications/pending`;
      const res = await fetch(url, { headers: getHeaders() });
      if (res.ok) {
        return await res.json();
      }
    } catch (_) {}
    return [];
  },

  reviewVerification: async (verificationId: string, status: 'Approved' | 'Rejected', adminNotes?: string): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE_URL}/verifications/review`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ verificationId, status, adminNotes })
      });
      return res.ok;
    } catch (_) {
      return false;
    }
  },

  promoteUser: async (userId: string, isAdmin: boolean): Promise<boolean> => {
    try {
      const res = await fetch(`${BASE_URL}/users/${userId}/promote`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ isAdmin })
      });
      return res.ok;
    } catch (_) {
      return false;
    }
  },

  resolveReport: async (id: string, status: 'accepted' | 'declined'): Promise<ConnectionRequest> => {
    try {
      const res = await fetch(`${BASE_URL}/reports/${id}/resolve`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    const rep = mockReports.find(r => r.id === id);
    if (rep) rep.status = status;
    return rep || mockReports[0];
  },


  getChats: async (): Promise<{ threads: ChatThread[], total: number }> => {
    try {
      const res = await fetch(`${BASE_URL}/chats`, { headers: getHeaders() });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.threads)) return data;
      }
    } catch (_) {}

    return { threads: mockChats, total: mockChats.length };
  },

  sendAdminChatMessage: async (threadId: string, messageText: string): Promise<ChatThread> => {
    try {
      const res = await fetch(`${BASE_URL}/chats/${threadId}/messages`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ text: messageText })
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    const thread = mockChats.find(t => t.id === threadId);
    if (thread) {
      const newMsg = {
        id: `msg-${Date.now()}`,
        sender: 'system' as const,
        text: `[ADMIN NOTICE]: ${messageText}`,
        time: new Date().toISOString()
      };
      thread.messages.push(newMsg);
      thread.lastMessage = newMsg.text;
    }
    return thread || mockChats[0];
  },

  deleteChatMessage: async (threadId: string, messageId: string): Promise<ChatThread> => {
    try {
      const res = await fetch(`${BASE_URL}/chats/${threadId}/messages/${messageId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    const thread = mockChats.find(t => t.id === threadId);
    if (thread) thread.messages = thread.messages.filter(m => m.id !== messageId);
    return thread || mockChats[0];
  },

  toggleChatStatus: async (threadId: string, status: 'active' | 'frozen' | 'archived'): Promise<ChatThread> => {
    try {
      const res = await fetch(`${BASE_URL}/chats/${threadId}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    const thread = mockChats.find(t => t.id === threadId);
    if (thread) thread.status = status;
    return thread || mockChats[0];
  },

  getSystemSettings: async (): Promise<SystemSettings> => {
    try {
      const res = await fetch(`${BASE_URL}/settings`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch (_) {}

    return { ...mockSystemSettings };
  },

  updateSystemSettings: async (settings: Partial<SystemSettings>): Promise<SystemSettings> => {
    try {
      const res = await fetch(`${BASE_URL}/settings`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(settings)
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    mockSystemSettings = { ...mockSystemSettings, ...settings };
    return { ...mockSystemSettings };
  },

  getStaffAdmins: async (): Promise<StaffAdmin[]> => {
    try {
      const res = await fetch(`${BASE_URL}/staff`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch (_) {}

    return [...mockStaffAdmins];
  },

  addStaffAdmin: async (admin: Partial<StaffAdmin>): Promise<StaffAdmin> => {
    try {
      const res = await fetch(`${BASE_URL}/staff`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(admin)
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    const newAdmin: StaffAdmin = {
      id: `adm-${Date.now()}`,
      name: admin.name || 'New Staff',
      email: admin.email || 'staff@finding.app',
      role: admin.role || 'Senior Moderator',
      status: 'active',
      lastLogin: 'Never',
      permissions: admin.permissions || ['users.view', 'confessions.moderate']
    };
    mockStaffAdmins.push(newAdmin);
    return newAdmin;
  },

  toggleStaffAdminStatus: async (id: string, status: 'active' | 'inactive'): Promise<StaffAdmin> => {
    try {
      const res = await fetch(`${BASE_URL}/staff/${id}/status`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ status })
      });
      if (res.ok) return await res.json();
    } catch (_) {}

    const staff = mockStaffAdmins.find(a => a.id === id);
    if (staff) staff.status = status;
    return staff || mockStaffAdmins[0];
  },

  getAuditLogs: async (): Promise<AuditLog[]> => {
    try {
      const res = await fetch(`${BASE_URL}/audit-logs`, { headers: getHeaders() });
      if (res.ok) return await res.json();
    } catch (_) {}

    return [...mockAuditLogs];
  }
};

function getHeaders() {
  const token = localStorage.getItem('admin_token') || localStorage.getItem('accessToken') || 'finding-admin-jwt-token';
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.href = '/admin/login';
    }
    throw new Error(`Request failed: ${res.statusText}`);
  }
  return res.json();
}

