import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { router } from '@/routes';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { authService } from '@/services/authService';

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
 * and applies the persisted theme setting.
 */
export default function App() {
  const { setAuth, setLoading, logout } = useAuthStore();
  const { theme } = useUIStore();

  // ─── Initialize auth on app load ─────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    async function initAuth() {
      try {
        setLoading(true);
        const res = await authService.refreshToken();
        if (isMounted) {
          if (res.data) {
            setAuth(res.data.user, res.data.accessToken);
          } else {
            logout();
          }
        }
      } catch {
        if (isMounted) {
          logout();
        }
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
    </QueryClientProvider>
  );
}
