import { api } from '@/src/api/api';
import { tokenStorage } from '@/src/api/tokenStorage';
import type { LoginPayload, TokenResponse, RefreshTokenResponse } from '../types/auth';

export const authService = {
  login: async (data: LoginPayload) => {
    const response = await api.post<TokenResponse>('/token/', data);
    await tokenStorage.saveTokens(response.data);
    return response.data;
  },

  refreshToken: async () => {
    const refresh = await tokenStorage.getRefreshToken();
    if (!refresh) throw new Error('Please sign in again.');
    const response = await api.post<RefreshTokenResponse>('/token/refresh/', { refresh });
    await tokenStorage.saveTokens({ access: response.data.access, refresh: response.data.refresh ?? refresh });
    return response.data;
  },

  logout: async () => {
    // The supplied backend has no logout/revoke endpoint.
    await tokenStorage.clearTokens();
  },
};
