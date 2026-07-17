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
    title: 'Marcas',
    description:
      'Inteligencia competitiva OOH: share of voice, inversión estimada, cobertura geográfica y mix de formatos por marca.',
    icon: '/icons/clipboard-check.svg',
    profiles: [USER_PROFILES.AGENCIA, USER_PROFILES.ADMIN],
    status: 'available',
  },
  {
    slug: 'format-review',
    title: 'Formatos',
    description:
      'Compara la actividad OOH entre tipos de elemento: presencia, inversión, cobertura geográfica y audiencia.',
    icon: '/icons/layout-grid.svg',
    profiles: [USER_PROFILES.AGENCIA, USER_PROFILES.ADMIN],
    status: 'available',
  },
  {
    slug: 'territory-review',
    title: 'Territorios',
    description:
      'Compara regiones o comunas entre sí: presencia publicitaria, inversión, mix de formatos y audiencia.',
    icon: '/icons/map-pin.svg',
    profiles: [USER_PROFILES.AGENCIA, USER_PROFILES.ADMIN],
    status: 'available',
  },
  {
    slug: 'category-review',
    title: 'Categorías',
    description:
      'Compara categorías de anunciantes: share of voice, inversión estimada, cobertura geográfica y mix de formatos.',
    icon: '/icons/tag.svg',
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
