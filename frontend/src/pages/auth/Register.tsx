import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../../config';

const roles = [
  'OWNER',
  'MANAGER',
  'KITCHEN',
  'WAITER',
  'CASHIER',
  'EMPLOYEE',
];

const Register: React.FC = () => {
  const { register } = useAuth();
  const [searchParams] = useSearchParams();
  const urlWorkspaceCode = searchParams.get('workspace') || '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(roles[3]); // Default to WAITER
  const [workspaceName, setWorkspaceName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [workspaceCode, setWorkspaceCode] = useState(urlWorkspaceCode);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [workspacePreview, setWorkspacePreview] = useState<{ workspace_name: string; owner_name: string } | null>(null);
  const [checkingCode, setCheckingCode] = useState(false);
  const [codeValid, setCodeValid] = useState(false);

  useEffect(() => {
    if (role === 'OWNER') {
      setCodeValid(true);
      setWorkspacePreview(null);
      return;
    }

    if (!workspaceCode || workspaceCode.trim().length < 4) {
      setCodeValid(false);
      setWorkspacePreview(null);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setCheckingCode(true);
      try {
        const res = await axios.get(`${API_BASE}/workspace/by-code/${workspaceCode.trim()}`);
        setWorkspacePreview(res.data);
        setCodeValid(true);
      } catch (err) {
        setWorkspacePreview(null);
        setCodeValid(false);
      } finally {
        setCheckingCode(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [workspaceCode, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        name,
        email,
        password,
        role,
        workspaceName: role === 'OWNER' ? workspaceName : undefined,
        restaurantName: role === 'OWNER' ? restaurantName : undefined,
        workspaceCode: role !== 'OWNER' ? workspaceCode : undefined,
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#070A13] px-4 py-12 text-white">
      <div className="w-full max-w-lg rounded-[2.5rem] border border-white/10 bg-slate-950/85 p-10 shadow-2xl shadow-cyan-500/5 backdrop-blur-xl">
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-400">Join SmartServe AI</p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight">Create an account</h2>
          <p className="mt-2 text-sm text-slate-400">
            Or{' '}
            <Link to="/auth/login" className="text-cyan-400 hover:text-cyan-300 font-semibold transition">
              sign in to your existing account
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
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none transition"
              placeholder="Your full name"
            />
          </div>

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
              minLength={8}
              required
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none transition"
              placeholder="Min. 8 characters"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none transition"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {role === 'OWNER' ? (
            <div className="space-y-5 border-t border-white/5 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-cyan-400">Workspace Setup</p>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Workspace Name</label>
                <input
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none transition"
                  placeholder="e.g. Downtown Cafe Workspace"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Restaurant Name</label>
                <input
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white focus:border-cyan-400 focus:outline-none transition"
                  placeholder="e.g. Downtown Cafe"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-5 border-t border-white/5 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Join Workspace</p>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Workspace Code</label>
                <input
                  value={workspaceCode}
                  onChange={(e) => setWorkspaceCode(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-amber-500/30 bg-white/5 px-4 py-3 text-sm text-white focus:border-amber-400 focus:outline-none transition uppercase"
                  placeholder="e.g. ANNAM7821"
                />
                <p className="mt-1.5 text-xs text-slate-400">Ask your workspace owner for their 9-digit code.</p>

                {checkingCode && (
                  <p className="mt-2 text-xs text-cyan-400 animate-pulse">Verifying workspace code...</p>
                )}

                {!checkingCode && codeValid && workspacePreview && (
                  <div className="mt-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-400 animate-[bounce_0.2s_1]">
                    <p className="font-bold">✓ Workspace Found</p>
                    <p className="mt-1 font-semibold text-white">Restaurant: {workspacePreview.workspace_name.replace("'s Workspace", "")}</p>
                    <p className="text-slate-400">Owner: {workspacePreview.owner_name}</p>
                  </div>
                )}

                {!checkingCode && workspaceCode && !codeValid && (
                  <div className="mt-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs text-red-400">
                    ✗ Workspace not found. Please check the code.
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="pt-2">
            <button
              disabled={loading || (role !== 'OWNER' && !codeValid)}
              className="w-full rounded-2xl bg-cyan-500 py-3 text-sm font-semibold text-white transition hover:bg-cyan-600 focus:outline-none disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
