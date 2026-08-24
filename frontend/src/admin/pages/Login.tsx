import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, AdminRole } from '../store/AuthContext';
import { Shield, Eye, EyeOff, Lock, User } from 'lucide-react';
import { api } from '../services/api';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.login(username.trim(), password.trim());
      const token = data.token || data.accessToken || 'finding-admin-jwt-token';
      const role: AdminRole = 'Super Admin';
      const name = data.user?.name || 'Super Admin';

      login(token, role, name);
      navigate('/admin');
    } catch (err: any) {
      setError(err.message || 'Invalid admin credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--color-primary)] mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-[var(--color-on-primary)]" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--color-on-background)]">Admin Console</h1>
          <p className="text-[var(--color-on-surface-variant)] mt-1 text-sm">Finding Platform — Admin & Super Admin</p>
        </div>

        {/* Role hint badges */}
        <div className="flex gap-2 justify-center mb-6">
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20">
            👑 Super Admin
          </span>
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] border border-[var(--color-secondary)]/20">
            🛡 Admin
          </span>
        </div>

        {/* Card */}
        <div className="neo-outset p-8 rounded-3xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-1.5">
                Username / Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-on-surface-variant)]" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  required
                  placeholder="himanshumishra1601@gmail.com or admin"
                  className="w-full pl-10 pr-4 py-3 neo-inset rounded-xl text-sm text-[var(--color-on-surface)] bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[var(--color-on-surface-variant)] uppercase tracking-widest mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-on-surface-variant)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 neo-inset rounded-xl text-sm text-[var(--color-on-surface)] bg-transparent focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-on-surface-variant)] hover:text-[var(--color-primary)]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-[var(--color-error-container)] text-[var(--color-on-error-container)] text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--color-primary)] text-[var(--color-on-primary)] rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Shield className="w-4 h-4" />
              )}
              {loading ? 'Signing in...' : 'Sign In to Admin'}
            </button>
          </form>

          <p className="text-center text-xs text-[var(--color-on-surface-variant)] mt-5 opacity-60">
            Use your Finding account credentials. Admin flag must be enabled.
          </p>
        </div>
      </div>
    </div>
  );
}
