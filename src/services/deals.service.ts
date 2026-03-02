// src/services/deals.service.ts
import api from './api';
import { Deal } from '@/types';

export const dealsService = {
  // Get all deals
  getAll: async (): Promise<Deal[]> => {
    const response = await api.get<Deal[]>('/deals');
    return response.data;
  },

  // Get single deal by ID
  getById: async (id: string): Promise<Deal> => {
    const response = await api.get<Deal>(`/deals/${id}`);
    return response.data;
  },

  // Update deal stage
  updateStage: async (id: string, stage: string): Promise<Deal> => {
    const response = await api.patch<Deal>(`/deals/${id}/stage`, { stage });
    return response.data;
  },
};
