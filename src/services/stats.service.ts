// src/services/stats.service.ts
import api from './api';
import { Stats } from '@/types';

export const statsService = {
  // Get dashboard stats
  getStats: async (): Promise<Stats> => {
    const response = await api.get<Stats>('/stats');
    return response.data;
  },
};
