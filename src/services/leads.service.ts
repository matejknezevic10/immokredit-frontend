// src/services/leads.service.ts
import api from './api';
import { Lead, CreateLeadDto, UpdateLeadDto } from '@/types';

export const leadsService = {
  // Get all leads
  getAll: async (): Promise<Lead[]> => {
    const response = await api.get<Lead[]>('/leads');
    return response.data;
  },

  // Get single lead by ID
  getById: async (id: string): Promise<Lead> => {
    const response = await api.get<Lead>(`/leads/${id}`);
    return response.data;
  },

  // Create new lead
  create: async (data: CreateLeadDto): Promise<Lead> => {
    const response = await api.post<Lead>('/leads', data);
    return response.data;
  },

  // Update lead
  update: async (id: string, data: UpdateLeadDto): Promise<Lead> => {
    const response = await api.patch<Lead>(`/leads/${id}`, data);
    return response.data;
  },

  // Delete lead
  delete: async (id: string): Promise<void> => {
    await api.delete(`/leads/${id}`);
  },
};
