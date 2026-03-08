// src/pages/Documents/api.ts

export const API_BASE = import.meta.env.VITE_API_URL || 'https://immokredit-backend-production.up.railway.app';

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = localStorage.getItem('immokredit_token');
  const res = await fetch(`${API_BASE}/documents${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}

export async function apiGenericFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = localStorage.getItem('immokredit_token');
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...options,
  });
  if (!res.ok) throw new Error(`API Error: ${res.status}`);
  return res.json();
}
