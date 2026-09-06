import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from '@/routes';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { authService } from '@/services/authService';
import { SessionExpiredModal } from '@/components/ui/SessionExpiredModal';

/**
 * TanStack Query client configuration.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * Root application component.
 * Initializes auth state on mount by attempting a token refresh,
 * applies the persisted theme setting, and mounts the SessionExpiredModal.
 */
export default function App() {
  const { setAuth, setLoading, logout } = useAuthStore();
  const { theme } = useUIStore();

  // ─── Initialize auth on app load ─────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    async function initAuth() {
      const state = useAuthStore.getState();

      // Case 1: Session already stored in localStorage
      if (state.accessToken && state.user) {
        try {
          // Validate current token & get updated role from server
          const res = await authService.getMe();
          if (isMounted && res.data?.user) {
            useAuthStore.getState().setUser(res.data.user);
          }
        } catch {
          // Access token might have expired; try refreshing with cookie
          try {
            const refreshRes = await authService.refreshToken();
            if (isMounted && refreshRes.data) {
              setAuth(refreshRes.data.user, refreshRes.data.accessToken);
            }
          } catch {
            // Both access token and refresh token failed
            if (isMounted) {
              logout();
            }
          }
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
        return;
      }

      // Case 2: No session in localStorage, check if refresh cookie exists
      try {
        setLoading(true);
        const res = await authService.refreshToken();
        if (isMounted && res.data) {
          setAuth(res.data.user, res.data.accessToken);
        }
      } catch {
        // No existing session; remain logged out
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    initAuth();
    return () => {
      isMounted = false;
    };
  }, [setAuth, setLoading, logout]);

  // ─── Monitor session expiration ─────────────────────────────────────────
  useEffect(() => {
    const checkTokenExpiration = () => {
      const { accessToken, isAuthenticated, isSessionExpired } = useAuthStore.getState();
      if (!isAuthenticated || !accessToken || isSessionExpired) return;

      try {
        const parts = accessToken.split('.');
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1]));
          if (payload.exp && Date.now() >= payload.exp * 1000) {
            // Token expired; attempt token refresh
            authService.refreshToken()
              .then((res) => {
                if (res.data?.accessToken) {
                  useAuthStore.getState().setAccessToken(res.data.accessToken);
                }
              })
              .catch(() => {
                // Refresh failed; trigger session expired dialog
                useAuthStore.getState().setSessionExpired(true);
              });
          }
        }
      } catch {
        // Ignore parsing errors
      }
    };

    const interval = setInterval(checkTokenExpiration, 20 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ─── Apply theme on mount ────────────────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement;
    if (
      theme === 'dark' ||
      (theme === 'system' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches)
    ) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <SessionExpiredModal />
    </QueryClientProvider>
  );
}
