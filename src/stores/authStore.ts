import { create } from 'zustand';
import { User, getCurrentUser, logout as apiLogout } from '@/services/authApi';

interface AuthState {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  checkAuth: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user }),

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
