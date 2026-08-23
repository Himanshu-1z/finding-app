export interface UserProfile {
  id: string; // ADMIN-ONLY
  status: 'active' | 'suspended' | 'pending_verification'; // ADMIN-ONLY
  createdAt: string; // ADMIN-ONLY
  lastActiveAt: string; // ADMIN-ONLY
  secretName: string;
  gender: string;
  name: string;
  college?: string;
  semester: string;
  branch?: string;
  section?: string;
  dob: string;
  mobile: string;
  email: string;
  capturedIdImage: string | null;
  isSetupComplete: boolean;
  isVerifiedBadge?: boolean;
}

export interface Confession {
  id: string;
  status: 'visible' | 'hidden' | 'removed'; // ADMIN-ONLY
  reportCount: number; // ADMIN-ONLY
  author: string;
  time: string;
  content: string;
  likes: number;
  likedByMe: boolean;
  isRequested: boolean;
  type: 'public' | 'tagged';
  targetPerson?: string;
  targetCollege?: string;
  targetSemester?: string;
  authorCollege?: string;
  isMine?: boolean;
  isPinned?: boolean;
}

export interface ConnectionRequest {
  id: string;
  fromUser: string;
  avatarUrl: string;
  status: 'pending' | 'accepted' | 'declined';
  reason?: string;
  timestamp?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'me' | 'them' | 'system';
  senderId?: string;
  senderName?: string;
  senderRealName?: string;
  senderEmail?: string;
  text?: string;
  image?: string;
  fileName?: string;
  fileSize?: string;
  time: string;
}

export interface ChatThread {
  id: string;
  name: string;
  letter: string;
  status: 'active' | 'frozen' | 'archived';
  lastMessage: string;
  time: string;
  unread: number;
  user1?: { id: string; name: string; realName?: string; email?: string };
  user2?: { id: string; name: string; realName?: string; email?: string };
  messages: ChatMessage[];
}

export interface DashboardStats {
  totalUsers: number;
  pendingVerifications: number;
  confessionsToday: number;
  openReports: number;
  systemHealth: string;
  activeAdmins: number;
  maintenanceMode: boolean;
}

export interface StaffAdmin {
  id: string;
  name: string;
  email: string;
  role: 'Super Admin' | 'Senior Moderator' | 'Content Auditor' | 'Support Staff';
  status: 'active' | 'inactive';
  lastLogin: string;
  permissions: string[];
}

export interface SystemSettings {
  maintenanceMode: boolean;
  readOnlyMode: boolean;
  allowRegistrations: boolean;
  autoModSensitivity: 'strict' | 'balanced' | 'off';
  postRateLimit: number; // per hour
  broadcastMessage: string;
  broadcastActive: boolean;
}

export interface AuditLog {
  id: string;
  adminName: string;
  action: string;
  target: string;
  timestamp: string;
  type: 'security' | 'user' | 'content' | 'system';
}

