import api from './api';
import type { ApiResponse } from '@/types/api';
import type { User } from '@/types/user';

// ─── Response Types ──────────────────────────────────────────────────────────

interface AuthResponse {
  user: User;
  accessToken: string;
}

// ─── API Calls ───────────────────────────────────────────────────────────────

export const authService = {
  async register(data: { name: string; email: string; password: string }) {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/register', data);
    return res.data;
  },

  async login(data: { email: string; password: string }) {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return res.data;
  },

  async logout() {
    const res = await api.post<ApiResponse<null>>('/auth/logout');
    return res.data;
  },

  async refreshToken() {
    const res = await api.post<ApiResponse<AuthResponse>>('/auth/refresh');
    return res.data;
  },

  async forgotPassword(data: { email: string }) {
    const res = await api.post<ApiResponse<null>>('/auth/forgot-password', data);
    return res.data;
  },

  async resetPassword(data: { token: string; password: string }) {
    const res = await api.post<ApiResponse<null>>('/auth/reset-password', data);
    return res.data;
  },

  async getMe() {
    const res = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    return res.data;
  },
};
