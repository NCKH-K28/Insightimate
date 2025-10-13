import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  setToken: (token: string | null) => void;
  clearSession: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
      clearSession: () => set({ token: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage<AuthState>(() => localStorage),
    },
  ),
);
