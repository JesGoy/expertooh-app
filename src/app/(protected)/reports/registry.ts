import { USER_PROFILES, type UserProfile } from '@/core/domain/constants/profiles';

/**
 * Registro extensible de tipos de reporte del hub /reports.
 * Para agregar un nuevo reporte: agregar una entrada aquí y crear
 * la carpeta src/app/(protected)/reports/<slug>/ con su page.tsx.
 */
export interface ReportDefinition {
  slug: string;
  title: string;
  description: string;
  icon: string;
  profiles: UserProfile[];
  status: 'available' | 'coming-soon';
}

export const REPORTS: ReportDefinition[] = [
  {
    slug: 'brand-review',
    title: 'Brand Review',
    description:
      'Inteligencia competitiva OOH: share of voice, inversión estimada, cobertura geográfica y mix de formatos por marca.',
    icon: '/icons/clipboard-check.svg',
    profiles: [USER_PROFILES.AGENCIA, USER_PROFILES.ADMIN],
    status: 'available',
  },
];

export function reportsForProfile(profile: string): ReportDefinition[] {
  return REPORTS.filter((r) => r.profiles.includes(profile as UserProfile));
}

export function findReport(slug: string): ReportDefinition | undefined {
  return REPORTS.find((r) => r.slug === slug);
}

export function canAccessReport(profile: string, slug: string): boolean {
  const report = findReport(slug);
  return !!report && report.profiles.includes(profile as UserProfile);
}
