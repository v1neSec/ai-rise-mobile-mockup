import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/src/utils/config';
import type { TokenResponse } from '@/src/types/auth';

// SecureStore is native-only. Web previews keep tokens in memory.
const webTokens = new Map<string, string>();
const get = (key: string) => Platform.OS === 'web'
  ? Promise.resolve(webTokens.get(key) ?? null)
  : SecureStore.getItemAsync(key);
const set = (key: string, value: string) => {
  if (Platform.OS === 'web') { webTokens.set(key, value); return Promise.resolve(); }
  return SecureStore.setItemAsync(key, value);
};
const remove = (key: string) => {
  if (Platform.OS === 'web') { webTokens.delete(key); return Promise.resolve(); }
  return SecureStore.deleteItemAsync(key);
};

export const tokenStorage = {
  getAccessToken: () => get(TOKEN_KEY),
  getRefreshToken: () => get(REFRESH_TOKEN_KEY),
  saveTokens: async (tokens: TokenResponse) => {
    try {
      await set(REFRESH_TOKEN_KEY, tokens.refresh);
      await set(TOKEN_KEY, tokens.access);
    } catch (error) {
      await tokenStorage.clearTokens();
      throw error;
    }
  },
  clearTokens: async () => {
    await Promise.all([remove(TOKEN_KEY), remove(REFRESH_TOKEN_KEY)]);
  },
};
