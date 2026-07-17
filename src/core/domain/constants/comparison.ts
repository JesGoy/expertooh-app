/**
 * Reglas de negocio del comparador de entidades OOH.
 * Cada dimensión comparable define sus breakdowns secundarios, capacidades
 * y los filtros incompatibles (nunca se filtra por la dimensión comparada).
 */

export const COMPARISON_ENTITY_KINDS = {
  BRAND: 'brand',
  TYPE: 'type',
  REGION: 'region',
  COMMUNE: 'commune',
  CATEGORY: 'category',
} as const;

export type ComparisonEntityKind =
  (typeof COMPARISON_ENTITY_KINDS)[keyof typeof COMPARISON_ENTITY_KINDS];

/** Breakdown secundario de los gráficos: cualquier dimensión menos la marca */
export type ComparisonBreakdown = Exclude<ComparisonEntityKind, 'brand'>;

/** 'geo' se resuelve a region|commune según el filtro regionId activo */
export type BreakdownSlot = ComparisonBreakdown | 'geo';

export type ComparisonFilterKey = 'regionId' | 'communeId' | 'typeId' | 'providerId' | 'categoryId';

export interface ComparisonRules {
  /** [0] = gráfico de barras agrupadas, [1] = gráfico de barras apiladas */
  breakdowns: [BreakdownSlot, BreakdownSlot];
  supportsPhotos: boolean;
  /** Solo las marcas distinguen entidades "propias" (agencia) */
  supportsOwn: boolean;
  conflictingFilters: ComparisonFilterKey[];
}

/**
 * Un breakdown nunca coincide con la dimensión comparada. Comparando
 * regiones/comunas no hay breakdown geográfico (cada comuna pertenece a una
 * sola región: el gráfico degenera). Fotos solo donde aportan evidencia
 * distintiva (campañas por marca, aspecto físico por formato).
 */
export const COMPARISON_RULES: Record<ComparisonEntityKind, ComparisonRules> = {
  brand: {
    breakdowns: ['geo', 'type'],
    supportsPhotos: true,
    supportsOwn: true,
    conflictingFilters: [],
  },
  type: {
    breakdowns: ['geo', 'category'],
    supportsPhotos: true,
    supportsOwn: false,
    conflictingFilters: ['typeId'],
  },
  region: {
    breakdowns: ['type', 'category'],
    supportsPhotos: false,
    supportsOwn: false,
    conflictingFilters: ['regionId', 'communeId'],
  },
  commune: {
    breakdowns: ['type', 'category'],
    supportsPhotos: false,
    supportsOwn: false,
    conflictingFilters: ['regionId', 'communeId'],
  },
  category: {
    breakdowns: ['geo', 'type'],
    supportsPhotos: false,
    supportsOwn: false,
    conflictingFilters: ['categoryId'],
  },
};
