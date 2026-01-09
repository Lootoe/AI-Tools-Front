import { create } from 'zustand';
import { User, getCurrentUser, logout as apiLogout } from '@/services/authApi';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  updateBalance: (balanceOrUpdater: number | ((prev: number) => number)) => void;
  checkAuth: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user }),

  updateBalance: (balanceOrUpdater) => set((state) => {
    if (!state.user) return state;
    const newBalance = typeof balanceOrUpdater === 'function'
      ? balanceOrUpdater(state.user.balance)
      : balanceOrUpdater;
    return { user: { ...state.user, balance: newBalance } };
  }),

  checkAuth: async () => {
    set({ loading: true });
    const user = await getCurrentUser();
    set({ user, loading: false });
  },

  logout: () => {
    apiLogout();
    set({ user: null });
  },
}));
