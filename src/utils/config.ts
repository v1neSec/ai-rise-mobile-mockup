export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL || 'https://ai-rise.onrender.com/api'
).replace(/\/+$/, '');

export const TOKEN_KEY = 'airise.access_token';
export const REFRESH_TOKEN_KEY = 'airise.refresh_token';
