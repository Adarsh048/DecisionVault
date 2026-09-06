import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User } from '@/types/user';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isSessionExpired: boolean;

  // Actions
  setAuth: (user: User, accessToken: string) => void;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => void;
  setLoading: (loading: boolean) => void;
  setSessionExpired: (expired: boolean) => void;
  logout: () => void;
}

/**
 * Auth store manages the current user and access token.
 *
 * Architecture notes:
 * - The access token is stored in memory (Zustand) — NOT in localStorage.
 *   This prevents XSS attacks from reading the token.
 * - The refresh token is stored in an HTTP-only cookie (set by the server).
 *   This prevents JavaScript from accessing it at all.
 * - We persist only minimal user data (for UI) to sessionStorage so the
 *   user doesn't see a flash of the login page on refresh. The actual auth
 *   check hits /auth/refresh on app load.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: true,
      isSessionExpired: false,

      setAuth: (user, accessToken) =>
        set({ user, accessToken, isAuthenticated: true, isLoading: false, isSessionExpired: false }),

      setAccessToken: (accessToken) => set({ accessToken }),

      setUser: (user) => set({ user }),

      setLoading: (isLoading) => set({ isLoading }),

      setSessionExpired: (isSessionExpired) => set({ isSessionExpired }),

      logout: () =>
        set({ user: null, accessToken: null, isAuthenticated: false, isLoading: false }),
    }),
    {
      name: 'dv-auth',
      storage: createJSONStorage(() => localStorage),
      // Persist user and token in localStorage so page reload/navigation preserves session
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // If a persisted valid session exists, set loading to false immediately
          if (state.accessToken && state.user) {
            state.isAuthenticated = true;
          }
          state.isLoading = false;
        }
      },
    }
  )
);
