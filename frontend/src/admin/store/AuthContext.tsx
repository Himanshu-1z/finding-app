import React, { createContext, useContext, useState, useEffect } from 'react';

export type AdminRole = 'Super Admin' | 'Admin' | null;

interface AuthContextType {
  token: string | null;
  role: AdminRole;
  adminName: string;
  login: (token: string, role: AdminRole, name: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem('admin_token') || localStorage.getItem('accessToken')
  );
  const [role, setRole] = useState<AdminRole>(
    (localStorage.getItem('admin_role') as AdminRole) || null
  );
  const [adminName, setAdminName] = useState(localStorage.getItem('admin_name') || 'Admin');

  useEffect(() => {
    if (token) {
      localStorage.setItem('admin_token', token);
    } else {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_role');
      localStorage.removeItem('admin_name');
    }
  }, [token]);

  const login = (newToken: string, newRole: AdminRole, name: string) => {
    setToken(newToken);
    setRole(newRole);
    setAdminName(name);
    localStorage.setItem('admin_token', newToken);
    localStorage.setItem('admin_role', newRole || 'Admin');
    localStorage.setItem('admin_name', name);
  };

  const logout = () => {
    setToken(null);
    setRole(null);
    setAdminName('Admin');
  };

  return (
    <AuthContext.Provider value={{
      token,
      role,
      adminName,
      login,
      logout,
      isAuthenticated: !!token,
      isSuperAdmin: role === 'Super Admin'
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
