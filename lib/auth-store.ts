import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from './types';

interface AuthState {
  token: string | null;
  refreshToken: string | null;
  user: User | null;
  isHydrated: boolean;
  setAuth: (token: string, refreshToken: string, user: User) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      isHydrated: false,
      setAuth: (token: string, refreshToken: string, user: User) => {
        set({ token, refreshToken, user });
      },
      clearAuth: () => {
        set({ token: null, refreshToken: null, user: null });
      },
      isAuthenticated: () => {
        const { token } = get();
        return !!token;
      },
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state) state.isHydrated = true
      },
    }
  )
);