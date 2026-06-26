"use client";

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [workspaceCode, setWorkspaceCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password, workspaceCode ? workspaceCode.trim().toUpperCase() : undefined);
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070A13] px-4 py-16 text-white">
      <div className="w-full max-w-md rounded-[2.5rem] border border-white/10 bg-slate-950/85 p-10 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-400">Welcome Back</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">Sign in to SmartServe</h2>
          <p className="mt-2 text-sm text-slate-400">
            Or{' '}
            <Link href="/auth/register" className="text-cyan-400 hover:text-cyan-300 font-semibold transition">
              create a new workspace account
            </Link>
          </p>
        </div>

        {error && (
          <div className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Email Address</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none transition"
              placeholder="name@restaurant.com"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Password</label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none transition"
              placeholder="Enter your password"
            />
          </div>

          <div className="border-t border-white/5 pt-4">
            <label className="block text-xs font-semibold uppercase tracking-wider text-amber-400 mb-2">
              Workspace Code (Optional)
            </label>
            <input
              value={workspaceCode}
              onChange={(e) => setWorkspaceCode(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none transition uppercase"
              placeholder="e.g. ANNAM7821"
            />
            <p className="mt-1.5 text-[11px] text-slate-500">Only enter if you wish to join/switch to a workspace.</p>
          </div>

          <div className="pt-2">
            <button
              disabled={loading}
              className="w-full rounded-2xl bg-cyan-500 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600 focus:outline-none disabled:opacity-50"
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
