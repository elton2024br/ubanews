import { create } from '@/lib/zustand';
import { AdminUser } from '@/shared/types/admin';

interface AuthState {
  user: AdminUser | null;
  loading: boolean;
  setUser: (user: AdminUser | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
}));
