import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useOrganizationStore } from '@/store/organizationStore';
import { authService } from '@/services/authService';
import type { AxiosError } from 'axios';
import type { ApiErrorResponse } from '@/types/api';

/**
 * useAuth hook — provides auth actions that coordinate between
 * the API, Zustand store, and navigation.
 */
export function useAuth() {
  const { setAuth, setLoading, logout: clearAuth, isAuthenticated, user } = useAuthStore();
  const { clearOrganization } = useOrganizationStore();
  const navigate = useNavigate();

  const register = useCallback(
    async (data: { name: string; email: string; password: string }) => {
      const res = await authService.register(data);
      if (res.data) {
        setAuth(res.data.user, res.data.accessToken);
        navigate('/app/dashboard');
      }
      return res;
    },
    [setAuth, navigate]
  );

  const login = useCallback(
    async (data: { email: string; password: string }) => {
      const res = await authService.login(data);
      if (res.data) {
        setAuth(res.data.user, res.data.accessToken);
        navigate('/app/dashboard');
      }
      return res;
    },
    [setAuth, navigate]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Logout should succeed even if the API call fails
    } finally {
      clearAuth();
      clearOrganization();
      navigate('/login');
    }
  }, [clearAuth, clearOrganization, navigate]);

  /**
   * Attempt to restore session on app load using the refresh token cookie.
   */
  const initializeAuth = useCallback(async () => {
    try {
      setLoading(true);
      const res = await authService.refreshToken();
      if (res.data) {
        setAuth(res.data.user, res.data.accessToken);
      }
    } catch {
      clearAuth();
    }
  }, [setAuth, setLoading, clearAuth]);

  /**
   * Extract a user-friendly error message from an Axios error.
   */
  const getErrorMessage = useCallback((error: unknown): string => {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    if (axiosError.code === 'ECONNABORTED' || axiosError.message?.toLowerCase().includes('timeout')) {
      return 'The cloud server took longer than expected to wake up from cold sleep. It is now warming up — please try again.';
    }
    if (axiosError.message?.toLowerCase().includes('network error')) {
      return 'Unable to reach backend server. If Render free tier is waking up from sleep, please try again in a few seconds.';
    }
    return (
      axiosError.response?.data?.message ||
      axiosError.message ||
      'An unexpected error occurred'
    );
  }, []);

  return {
    user,
    isAuthenticated,
    register,
    login,
    logout,
    initializeAuth,
    getErrorMessage,
  };
}
