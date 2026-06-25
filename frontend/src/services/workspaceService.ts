import axios from 'axios';
import { API_BASE } from '../config';

export async function getCurrentWorkspace(token: string): Promise<any> {
  const res = await axios.get(`${API_BASE}/workspace/current`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function getWorkspaceMembers(token: string): Promise<any[]> {
  const res = await axios.get(`${API_BASE}/workspace/members`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function regenerateWorkspaceCode(token: string): Promise<any> {
  const res = await axios.post(`${API_BASE}/workspace/regenerate-code`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function generateInviteLink(workspaceCode: string, token: string): Promise<any> {
  const res = await axios.post(`${API_BASE}/workspace/invite`, { workspaceCode }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function getWorkspaceByCode(code: string): Promise<any> {
  const res = await axios.get(`${API_BASE}/workspace/by-code/${code}`);
  return res.data;
}

export async function updateMemberRole(memberId: string, role: string, token: string): Promise<any> {
  const res = await axios.put(`${API_BASE}/workspace/members/${memberId}/role`, { role }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

export async function deactivateMember(memberId: string, status: string, token: string): Promise<any> {
  const res = await axios.put(`${API_BASE}/workspace/members/${memberId}/deactivate`, { status }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}
