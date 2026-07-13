/**
 * Port de agregaciones para el reporte Brand Review (inteligencia competitiva OOH).
 * Todas las agregaciones ocurren en SQL; el use case solo combina resultados.
 */

export type YearMonth = { year: number; month: number }; // month 1-12

export type BrandReviewFilters = {
  /** Set competitivo completo (1..MAX_BRANDS_PER_REVIEW marcas) */
  brandIds: number[];
  /** Subconjunto de brandIds que son marcas propias (para isOwn y orden de color) */
  ownBrandIds: number[];
  from: YearMonth;
  to: YearMonth;
  regionId?: number;
  communeId?: number;
  typeId?: number;
  providerId?: number;
  categoryId?: number;
};

export type BrandMetrics = {
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

export type BrandTotalsRow = BrandMetrics & {
  brandId: number;
  brandName: string;
  categoryName: string | null;
  /** Promedios ponderados por persons; null si audience = 0 */
  audienceProfile: AudienceProfile | null;
};

export type BrandMonthRow = { brandId: number; year: number; month: number } & BrandMetrics;

export type BrandGeoRow = { brandId: number; geoId: number; geoName: string } & BrandMetrics;

export type BrandTypeRow = { brandId: number; typeId: number; typeName: string } & BrandMetrics;

export type BrandPhotoRow = {
  brandId: number;
  recordId: number;
  photoUrl: string;
  capturedAt: Date | null;
  address: string | null;
  communeName: string | null;
  providerName: string | null;
};

export type GeoLevel = 'region' | 'commune';

export interface BrandReviewRepository {
  aggregateByBrand(filters: BrandReviewFilters): Promise<BrandTotalsRow[]>;
  aggregateByBrandMonth(filters: BrandReviewFilters): Promise<BrandMonthRow[]>;
  aggregateByBrandGeo(filters: BrandReviewFilters, level: GeoLevel): Promise<BrandGeoRow[]>;
  aggregateByBrandType(filters: BrandReviewFilters): Promise<BrandTypeRow[]>;
  samplePhotos(filters: BrandReviewFilters, perBrand: number): Promise<BrandPhotoRow[]>;
}
