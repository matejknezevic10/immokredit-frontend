// src/store/useAuthStore.ts
import { create } from 'zustand';
import api from '@/services/api';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: localStorage.getItem('immokredit_token'),
  isAuthenticated: false,
  isLoading: true,

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data;

    localStorage.setItem('immokredit_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('immokredit_token');
    delete api.defaults.headers.common['Authorization'];
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('immokredit_token');
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }

    try {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      const response = await api.get('/auth/me');
      set({ user: response.data, token, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('immokredit_token');
      delete api.defaults.headers.common['Authorization'];
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));