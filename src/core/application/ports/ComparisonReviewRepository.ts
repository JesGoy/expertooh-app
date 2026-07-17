/**
 * Port de agregaciones para los reportes de comparación de entidades OOH
 * (marcas, formatos, territorios, categorías). Todas las agregaciones ocurren
 * en SQL agrupadas por la dimensión comparada; el use case solo combina resultados.
 */
import type {
  ComparisonBreakdown,
  ComparisonEntityKind,
} from '@/core/domain/constants/comparison';

export type YearMonth = { year: number; month: number }; // month 1-12

export type ComparisonFilters = {
  /** Dimensión comparada (clave de agrupación SQL) */
  kind: ComparisonEntityKind;
  /** Set a comparar (1..MAX_ENTITIES_PER_COMPARISON) */
  entityIds: number[];
  /** Subconjunto de entityIds propios; solo kind='brand', [] en el resto */
  ownEntityIds: number[];
  from: YearMonth;
  to: YearMonth;
  regionId?: number;
  communeId?: number;
  typeId?: number;
  providerId?: number;
  categoryId?: number;
};

export type ComparisonMetrics = {
  /** Nº de caras/avisos observados (COUNT(*)) */
  faces: number;
  /** Soportes físicos únicos (COUNT(DISTINCT element_id)) */
  elements: number;
  /** Inversión estimada CLP (SUM(value_clp)) */
  investmentCLP: number;
  /** Superficie total m2 (SUM(area_m2)) */
  areaM2: number;
  /** Audiencia estimada (SUM(persons)); 0 si el período no tiene data */
  audience: number;
};

export type AudienceProfile = {
  malePct: number;
  femalePct: number;
  nseHighPct: number;
  nseMidPct: number;
  nseLowPct: number;
};

export type EntityTotalsRow = ComparisonMetrics & {
  entityId: number;
  entityName: string;
  /** Categoría de la marca; solo poblado cuando kind='brand' */
  categoryName: string | null;
  /** Promedios ponderados por persons; null si audience = 0 */
  audienceProfile: AudienceProfile | null;
};

export type EntityMonthRow = { entityId: number; year: number; month: number } & ComparisonMetrics;

export type EntityBreakdownRow = {
  entityId: number;
  breakdownId: number;
  breakdownName: string;
} & ComparisonMetrics;

export type EntityPhotoRow = {
  entityId: number;
  recordId: number;
  photoUrl: string;
  capturedAt: Date | null;
  address: string | null;
  communeName: string | null;
  providerName: string | null;
};

export interface ComparisonReviewRepository {
  aggregateTotals(filters: ComparisonFilters): Promise<EntityTotalsRow[]>;
  aggregateByMonth(filters: ComparisonFilters): Promise<EntityMonthRow[]>;
  aggregateByBreakdown(
    filters: ComparisonFilters,
    breakdown: ComparisonBreakdown,
  ): Promise<EntityBreakdownRow[]>;
  samplePhotos(filters: ComparisonFilters, perEntity: number): Promise<EntityPhotoRow[]>;
}
