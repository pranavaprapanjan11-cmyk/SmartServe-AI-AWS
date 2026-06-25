import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as workspaceService from '../../services/workspaceService';

interface WorkspaceData {
  id: string;
  workspace_code: string;
  workspace_name: string;
  owner_id: string;
  created_at: string;
  owner_name: string;
  total_employees: number;
  total_active_users: number;
}

interface WorkspaceMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

const WorkspacePage: React.FC = () => {
  const { token, user } = useAuth();
  const [workspace, setWorkspace] = useState<WorkspaceData | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Modals & Action States
  const [showRegenModal, setShowRegenModal] = useState(false);
  const [showEditRoleModal, setShowEditRoleModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState<WorkspaceMember | null>(null);
  const [newRole, setNewRole] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      loadData();
    }
  }, [token]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [wsData, mData] = await Promise.all([
        workspaceService.getCurrentWorkspace(token!),
        workspaceService.getWorkspaceMembers(token!)
      ]);
      setWorkspace(wsData);
      setMembers(mData);
    } catch (err: any) {
      console.error('Error loading workspace details:', err);
      setError(err?.response?.data?.error || 'Failed to fetch workspace details.');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast('Workspace code copied successfully.');
  };

  const handleCopyLink = (link: string) => {
    navigator.clipboard.writeText(link);
    showToast('Workspace invite link copied successfully.');
  };

  const handleRegenerateCode = async () => {
    try {
      setSubmitting(true);
      const res = await workspaceService.regenerateWorkspaceCode(token!);
      if (workspace) {
        setWorkspace({ ...workspace, workspace_code: res.workspace_code });
      }
      setShowRegenModal(false);
      showToast(`Workspace code regenerated successfully: ${res.workspace_code}`);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to regenerate workspace code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !newRole) return;
    try {
      setSubmitting(true);
      await workspaceService.updateMemberRole(selectedMember.id, newRole, token!);
      showToast(`Updated role for ${selectedMember.name} to ${newRole}`);
      setShowEditRoleModal(false);
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update member role.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleDeactivate = async (member: WorkspaceMember) => {
    const nextStatus = member.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const confirmMessage = nextStatus === 'INACTIVE'
      ? `Are you sure you want to deactivate ${member.name}? They will no longer be able to log attendance.`
      : `Are you sure you want to reactivate ${member.name}?`;
      
    if (!confirm(confirmMessage)) return;

    try {
      setSubmitting(true);
      await workspaceService.deactivateMember(member.id, nextStatus, token!);
      showToast(`Successfully set ${member.name} status to ${nextStatus}.`);
      loadData();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to update member status.');
    } finally {
      setSubmitting(false);
    }
  };

  const inviteLink = workspace 
    ? `${window.location.origin}/auth/register?workspace=${workspace.workspace_code}`
    : '';

  const qrCodeUrl = workspace
    ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(inviteLink)}&color=06B6D4&bgcolor=0F172A`
    : '';

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading workspace configurations...</div>;
  }

  return (
    <div className="flex h-full flex-col p-8 text-white overflow-y-auto space-y-8 relative">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-8 right-8 z-50 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-3 text-sm font-semibold text-emerald-400 shadow-2xl backdrop-blur-xl animate-[bounce_0.2s_1]">
          {toast}
        </div>
      )}

      {/* Header */}
      <div>
        <p className="text-sm uppercase tracking-[0.35em] text-cyan-300/70">Organization & Workspace</p>
        <h1 className="mt-4 text-4xl font-semibold text-white">Workspace Management</h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Manage your shared restaurant workspace details, invite staff members, configure roles, and monitor team access.
        </p>
      </div>

      {error && (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-4 text-red-200">{error}</div>
      )}

      {workspace && (
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Column 1 & 2: Overview & Invite Card */}
          <div className="lg:col-span-2 space-y-8">
            {/* Overview Card */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-md p-6 relative overflow-hidden">
              <div className="absolute right-0 top-0 -mr-16 -mt-16 h-40 w-40 rounded-full bg-cyan-500/5 blur-3xl"></div>
              <h2 className="text-lg font-semibold text-white mb-6">Workspace Overview</h2>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Workspace Name</p>
                  <p className="text-base font-semibold text-white">{workspace.workspace_name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Restaurant Name</p>
                  <p className="text-base font-semibold text-white">{workspace.workspace_name.replace("'s Workspace", "")}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Workspace Code</p>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-cyan-400 tracking-wider font-mono">{workspace.workspace_code}</span>
                    <button
                      onClick={() => handleCopyCode(workspace.workspace_code)}
                      className="text-slate-400 hover:text-white transition"
                      title="Copy Workspace Code"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Workspace ID</p>
                  <p className="text-xs font-mono text-slate-400 truncate">{workspace.id}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Owner</p>
                  <p className="text-base font-semibold text-white">{workspace.owner_name}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1">Created Date</p>
                  <p className="text-base text-slate-300">{new Date(workspace.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/5 flex flex-wrap justify-between items-center gap-4">
                <div className="flex gap-6">
                  <div>
                    <span className="text-2xl font-bold text-white">{workspace.total_active_users}</span>
                    <span className="ml-2 text-xs text-slate-500 uppercase tracking-wider">Active Users</span>
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-white">{workspace.total_employees}</span>
                    <span className="ml-2 text-xs text-slate-500 uppercase tracking-wider">Employees</span>
                  </div>
                </div>

                {user?.role === 'OWNER' && (
                  <button
                    onClick={() => setShowRegenModal(true)}
                    className="rounded-xl border border-white/10 bg-slate-950/70 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-900 hover:text-white transition"
                  >
                    Regenerate Code
                  </button>
                )}
              </div>
            </div>

            {/* Invite Card */}
            <div className="rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-md p-6">
              <h2 className="text-lg font-semibold text-white mb-2">Invite Staff</h2>
              <p className="text-xs text-slate-400 mb-6">
                Share this link or the code with new team members. Scanning the QR code will autofill the registry workspace code.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="text-2xs uppercase tracking-wider text-slate-500 font-bold block mb-1.5">Workspace Invitation Link</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={inviteLink}
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
                    />
                    <button
                      onClick={() => handleCopyLink(inviteLink)}
                      className="px-4 py-2 bg-cyan-500 text-xs font-semibold rounded-xl hover:bg-cyan-600 transition"
                    >
                      Copy Link
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Column 3: QR Code Card */}
          <div className="rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-md p-6 flex flex-col items-center justify-center text-center">
            <h2 className="text-lg font-semibold text-white mb-2">QR Code Invite</h2>
            <p className="text-xs text-slate-400 mb-6 max-w-xs">
              Place this QR code in the kitchen or employee breakroom for easy staff onboarding.
            </p>
            {qrCodeUrl ? (
              <div className="p-3 bg-white rounded-3xl inline-block shadow-xl shadow-cyan-500/5">
                <img src={qrCodeUrl} alt="Workspace Invite QR Code" className="h-48 w-48 rounded-2xl" />
              </div>
            ) : (
              <div className="h-48 w-48 bg-slate-950/40 border border-white/10 rounded-2xl flex items-center justify-center text-slate-600 text-xs">
                Generating QR...
              </div>
            )}
            <p className="text-xs font-mono text-cyan-400 font-bold mt-4 tracking-wider uppercase">{workspace.workspace_code}</p>
          </div>
        </div>
      )}

      {/* Members Section */}
      <div className="rounded-3xl border border-white/10 bg-slate-900/50 backdrop-blur-md overflow-hidden">
        <div className="px-6 py-5 border-b border-white/5 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white">Workspace Members</h2>
          <span className="px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs text-cyan-300 font-semibold">
            {members.length} Total Users
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-white/5 text-xs uppercase text-slate-400">
              <tr>
                <th className="px-6 py-4">Name / Contact</th>
                <th className="px-6 py-4">Workspace Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {members.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">No members found.</td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.id} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{member.name}</div>
                      <div className="text-xs text-slate-500">{member.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-200">{member.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-2xs font-extrabold uppercase rounded-full border ${
                        member.status === 'ACTIVE' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}>
                        {member.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      {(user?.role === 'OWNER' || user?.role === 'MANAGER') && member.id !== user.id && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedMember(member);
                              setNewRole(member.role);
                              setShowEditRoleModal(true);
                            }}
                            className="text-cyan-400 hover:text-cyan-300 text-xs font-semibold"
                          >
                            Edit Role
                          </button>
                          <button
                            onClick={() => handleToggleDeactivate(member)}
                            className={`${
                              member.status === 'ACTIVE' ? 'text-red-400 hover:text-red-300' : 'text-emerald-400 hover:text-emerald-300'
                            } text-xs font-semibold`}
                          >
                            {member.status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* REGENERATE CODE CONFIRMATION MODAL */}
      {showRegenModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-950 p-6 space-y-6 text-slate-200">
            <div className="flex items-center gap-3 text-amber-400">
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h3 className="text-lg font-bold text-white">Regenerate Workspace Code?</h3>
            </div>
            <div className="space-y-3 text-sm text-slate-400">
              <p>
                This will expire the current workspace code (<strong className="text-white font-mono">{workspace?.workspace_code}</strong>) and generate a new one.
              </p>
              <p className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-200">
                <strong>Warning:</strong> Existing staff can continue working. However, any new staff trying to register must use the new generated code.
              </p>
              <p>Are you sure you want to proceed?</p>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowRegenModal(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRegenerateCode}
                className="px-5 py-2 rounded-xl bg-amber-500 text-sm font-semibold text-slate-950 hover:bg-amber-600 hover:text-white transition disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? 'Regenerating...' : 'Regenerate Code'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT ROLE MODAL */}
      {showEditRoleModal && selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <form onSubmit={handleRoleUpdate} className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-950 p-6 space-y-4 text-slate-200">
            <h3 className="text-lg font-semibold text-white">Edit Member Role</h3>
            <p className="text-xs text-slate-400">Change role for <strong>{selectedMember.name}</strong> ({selectedMember.email})</p>
            <div>
              <label className="text-2xs uppercase tracking-wider text-slate-500 font-bold block mb-1.5">Select Role</label>
              <select
                value={newRole}
                onChange={e => setNewRole(e.target.value)}
                className="w-full bg-[#0a0f1d] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none"
              >
                <option value="OWNER">Owner</option>
                <option value="MANAGER">Manager</option>
                <option value="KITCHEN">Kitchen</option>
                <option value="WAITER">Waiter</option>
                <option value="CASHIER">Cashier</option>
                <option value="EMPLOYEE">Employee</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => { setShowEditRoleModal(false); setSelectedMember(null); }}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200"
                disabled={submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cyan-500 text-sm font-semibold hover:bg-cyan-600 transition disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? 'Updating...' : 'Save Role'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default WorkspacePage;
