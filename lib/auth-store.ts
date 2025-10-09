import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from './types';

interface AuthState {
  // access token is stored in memory only
  token: string | null;
  // refresh token is persisted (in localStorage)
  refreshToken: string | null;
  user: User | null;
  setAuth: (accessToken: string, user: User, refreshToken?: string | null) => void;
  setAccessToken: (accessToken: string | null) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      refreshToken: null,
      user: null,
      setAuth: (accessToken: string, user: User, refreshToken?: string | null) => {
        // store access token in memory only
        set({ token: accessToken, user });

        // If backend uses HttpOnly cookies for refresh tokens, front-end should NOT persist them.
        // We only persist refresh token if explicitly provided in the response (fallback for APIs
        // that return refresh token in JSON). Cookie-based flows are preferred.
        const rt = refreshToken ?? null;
        set({ refreshToken: rt });
        try {
          if (rt) {
            // Persist only when backend returns a refresh token in response body
            localStorage.setItem('refresh_token', rt);
            console.log('Refresh token saved to localStorage (response provided)');
          }
        } catch (e) {
          console.warn('Could not access localStorage for refresh token', e);
        }
      },
      setAccessToken: (accessToken: string | null) => {
        set({ token: accessToken });
      },
      clearAuth: () => {
        set({ token: null, refreshToken: null, user: null });
        try {
          localStorage.removeItem('refresh_token');
          console.log('Refresh token removed from localStorage');
        } catch (e) {
          console.warn('Could not remove refresh token from localStorage', e);
        }
      },
      isAuthenticated: () => {
        const { token } = get();
        return !!token;
      },
    }),
    {
      name: 'auth-storage',
      // only persist refreshToken and user to avoid storing access token on disk
      partialize: (state) => ({ refreshToken: state.refreshToken, user: state.user }),
    }
  )
);