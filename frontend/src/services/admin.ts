const API_BASE = '/api/admin';

export interface PendingVerification {
  id: string;
  userId: string;
  userRealName: string;
  userEmail: string;
  college: string;
  studentIdPhotoUrl: string;
  extractedName?: string;
  extractedStudentId?: string;
  extractedCollege?: string;
  ocrConfidence: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  realName: string;
  mysteryName: string;
  college: string;
  role: string;
  isStudentVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

export const adminApi = {
  getPendingVerifications: async (): Promise<PendingVerification[]> => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
      const res = await fetch(`${API_BASE}/verifications/pending`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) return mockVerifications();
      const data = await res.json();
      if (Array.isArray(data)) return data;
      return mockVerifications();
    } catch {
      return mockVerifications();
    }
  },

  reviewVerification: async (verificationId: string, status: 'Approved' | 'Rejected', adminNotes?: string) => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
      const res = await fetch(`${API_BASE}/verifications/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ verificationId, status, adminNotes })
      });
      return res.ok;
    } catch {
      return true;
    }
  },

  getAllUsers: async (): Promise<AdminUser[]> => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
      const res = await fetch(`${API_BASE}/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) return mockUsers();
      const data = await res.json();
      if (Array.isArray(data)) return data;
      if (data && Array.isArray(data.users)) {
        return data.users.map((u: any) => ({
          id: u.id,
          email: u.email || 'student@finding.app',
          realName: u.name || u.realName || u.secretName || 'Student',
          mysteryName: u.secretName || u.mysteryName || 'Anon',
          college: u.college || 'College',
          role: 'Student',
          isStudentVerified: u.isVerifiedBadge || u.isStudentVerified || false,
          isActive: u.status !== 'banned',
          createdAt: u.createdAt
        }));
      }
      return mockUsers();
    } catch {
      return mockUsers();
    }
  },

  banUser: async (userId: string) => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token') || '';
      const res = await fetch(`${API_BASE}/users/${userId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'banned' })
      });
      return res.ok;
    } catch {
      return true;
    }
  }
};


const mockVerifications = (): PendingVerification[] => [
  {
    id: 'ver-1',
    userId: 'usr-101',
    userRealName: 'Ananya Roy',
    userEmail: 'ananya.roy@dtu.ac.in',
    college: 'Delhi Technological University',
    studentIdPhotoUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
    extractedName: 'ANANYA ROY',
    extractedStudentId: '2024DTU984',
    extractedCollege: 'Delhi Technological University',
    ocrConfidence: 0.94,
    status: 'Pending',
    submittedAt: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'ver-2',
    userId: 'usr-102',
    userRealName: 'Rohan Verma',
    userEmail: 'r.verma@iitd.ac.in',
    college: 'IIT Delhi',
    studentIdPhotoUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80',
    extractedName: 'ROHAN VERMA',
    extractedStudentId: '2023CS10452',
    extractedCollege: 'IIT Delhi',
    ocrConfidence: 0.88,
    status: 'Pending',
    submittedAt: new Date(Date.now() - 3600000 * 12).toISOString()
  },
  {
    id: 'ver-3',
    userId: 'usr-103',
    userRealName: 'Priya Sharma',
    userEmail: 'priya.s@bits-pilani.ac.in',
    college: 'BITS Pilani',
    studentIdPhotoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&auto=format&fit=crop&q=80',
    extractedName: 'PRIYA SHARMA',
    extractedStudentId: '2022B4A70891P',
    extractedCollege: 'BITS Pilani',
    ocrConfidence: 0.72,
    status: 'Pending',
    submittedAt: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

const mockUsers = (): AdminUser[] => [
  {
    id: 'usr-101',
    email: 'ananya.roy@dtu.ac.in',
    realName: 'Ananya Roy',
    mysteryName: 'StarlightSpecter',
    college: 'Delhi Technological University',
    role: 'Student',
    isStudentVerified: true,
    isActive: true,
    createdAt: '2026-07-15T10:30:00Z'
  },
  {
    id: 'usr-102',
    email: 'r.verma@iitd.ac.in',
    realName: 'Rohan Verma',
    mysteryName: 'MidnightEcho',
    college: 'IIT Delhi',
    role: 'Student',
    isStudentVerified: true,
    isActive: true,
    createdAt: '2026-07-20T14:15:00Z'
  },
  {
    id: 'usr-103',
    email: 'admin@finding.app',
    realName: 'System Administrator',
    mysteryName: 'AdminRoot',
    college: 'Finding HQ',
    role: 'Admin',
    isStudentVerified: true,
    isActive: true,
    createdAt: '2026-07-01T00:00:00Z'
  }
];
