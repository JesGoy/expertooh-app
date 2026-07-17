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
  REPORT_FORMAT_REVIEW: '/reports/format-review',
  REPORT_TERRITORY_REVIEW: '/reports/territory-review',
  REPORT_CATEGORY_REVIEW: '/reports/category-review',
  CHANGE_PASSWORD: '/change-password',
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

export const API_ROUTES = {
  reportExport: (slug: string) => `/api/reports/${slug}/export`,
} as const;
