export type AppRole = 'resident' | 'volunteer';
export type BackendRole = 'passenger' | 'driver';
export const ROLE_MAP: Record<AppRole, BackendRole> = { resident: 'passenger', volunteer: 'driver' };
export type LoginPayload = { username: string; password: string };
export type TokenResponse = { access: string; refresh: string };
export type RefreshTokenResponse = { access: string; refresh?: string };
