/**
 * User profile constants — single source of truth for profile values.
 * Use these instead of string literals ('agencia', 'admin', ...) anywhere
 * outside the DB enum definition.
 */
export const USER_PROFILES = {
  ADMIN: 'admin',
  AGENCIA: 'agencia',
  CLIENTE: 'cliente',
  PROVEEDOR: 'proveedor',
} as const;

export type UserProfile = (typeof USER_PROFILES)[keyof typeof USER_PROFILES];

export const ALL_PROFILES: UserProfile[] = Object.values(USER_PROFILES);
