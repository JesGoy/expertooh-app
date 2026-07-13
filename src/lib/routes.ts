/**
 * Route constants — single source of truth for app paths.
 * Use these instead of string literals ('/login', '/dashboard', ...).
 */
export const ROUTES = {
  ROOT: '/',
  LOGIN: '/login',
  DASHBOARD: '/dashboard',
  REPORTS: '/reports',
  REPORT_BRAND_REVIEW: '/reports/brand-review',
  CHANGE_PASSWORD: '/change-password',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
