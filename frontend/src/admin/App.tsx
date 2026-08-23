import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './store/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Confessions from './pages/Confessions';
import Requests from './pages/Requests';
import Chats from './pages/Chats';
import Settings from './pages/Settings';
import Verifications from './pages/Verifications';
import Staff from './pages/Staff';

const AdminProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return <>{children}</>;
};

export function AdminModule() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<Login />} />
        <Route
          path="/"
          element={
            <AdminProtectedRoute>
              <Layout />
            </AdminProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="confessions" element={<Confessions />} />
          <Route path="requests" element={<Requests />} />
          <Route path="chats" element={<Chats />} />
          <Route path="verifications" element={<Verifications />} />
          <Route path="staff" element={<Staff />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default AdminModule;
