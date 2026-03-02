// src/store/useLeadsStore.ts
import { create } from 'zustand';
import { Lead, CreateLeadDto, UpdateLeadDto } from '@/types';
import { leadsService } from '@/services/leads.service';

interface LeadsStore {
  leads: Lead[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchLeads: () => Promise<void>;
  createLead: (data: CreateLeadDto) => Promise<Lead>;
  updateLead: (id: string, data: UpdateLeadDto) => Promise<Lead>;
  deleteLead: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useLeadsStore = create<LeadsStore>((set) => ({
  leads: [],
  isLoading: false,
  error: null,

  fetchLeads: async () => {
    set({ isLoading: true, error: null });
    try {
      const leads = await leadsService.getAll();
      set({ leads, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createLead: async (data: CreateLeadDto) => {
    set({ isLoading: true, error: null });
    try {
      const newLead = await leadsService.create(data);
      set((state) => ({
        leads: [newLead, ...state.leads],
        isLoading: false,
      }));
      return newLead;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateLead: async (id: string, data: UpdateLeadDto) => {
    set({ isLoading: true, error: null });
    try {
      const updatedLead = await leadsService.update(id, data);
      set((state) => ({
        leads: state.leads.map((lead) =>
          lead.id === id ? updatedLead : lead
        ),
        isLoading: false,
      }));
      return updatedLead;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteLead: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await leadsService.delete(id);
      set((state) => ({
        leads: state.leads.filter((lead) => lead.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
