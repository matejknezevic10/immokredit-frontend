// src/store/useStatsStore.ts
import { create } from 'zustand';
import { statsService } from '@/services/stats.service';

interface StatsStore {
  stats: {
    totalLeads: number;
    greenLeads: number;
    yellowLeads: number;
    redLeads: number;
    activeDeals: number;
    automationsToday: number;
  } | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchStats: () => Promise<void>;
  clearError: () => void;
}

export const useStatsStore = create<StatsStore>((set) => ({
  stats: null,
  isLoading: false,
  error: null,

  fetchStats: async () => {
    set({ isLoading: true, error: null });
    try {
      const stats = await statsService.getStats();
      set({ stats, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
