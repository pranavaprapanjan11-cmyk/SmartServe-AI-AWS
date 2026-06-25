// File: frontend/src/services/authService.ts
// Small service wrapper for authentication API calls

import axios from 'axios';
import { API_BASE } from '../config';

export interface AuthResponse {
  token: string;
  user: any;
}

export async function register(payload: any) {
  const res = await axios.post<AuthResponse>(`${API_BASE}/auth/register`, payload);
  return res.data;
}

export async function login(payload: any) {
  const res = await axios.post<AuthResponse>(`${API_BASE}/auth/login`, payload);
  return res.data;
}

export async function fetchMe(token: string) {
  const res = await axios.get(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
  return res.data;
}
