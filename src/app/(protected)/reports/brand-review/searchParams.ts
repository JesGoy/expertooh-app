import type { BrandReviewFilters, YearMonth } from '@/core/application/ports/BrandReviewRepository';
import { MAX_BRANDS_PER_REVIEW } from '@/core/application/usecases/GetBrandReview';

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

function parseIdList(value: string | string[] | undefined): number[] {
  const raw = first(value);
  if (!raw) return [];
  return raw
    .split(',')
    .map((part) => Number(part))
    .filter((n) => Number.isInteger(n) && n > 0);
}

function parseOptionalId(value: string | string[] | undefined): number | undefined {
  const n = Number(first(value));
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

/** "2021-01" -> { year: 2021, month: 1 } */
function parseYearMonth(value: string | string[] | undefined): YearMonth | null {
  const raw = first(value);
  const match = raw?.match(/^(\d{4})-(\d{1,2})$/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

export function serializeYearMonth(ym: YearMonth): string {
  return `${ym.year}-${String(ym.month).padStart(2, '0')}`;
}

/**
 * Parsea los searchParams del reporte. Devuelve null si aún no hay una
 * selección válida (sin marcas o período malformado) — la página muestra
 * solo los filtros en ese caso.
 */
export function parseBrandReviewSearchParams(sp: SearchParams): BrandReviewFilters | null {
  const brandIds = parseIdList(sp.brands).slice(0, MAX_BRANDS_PER_REVIEW);
  const from = parseYearMonth(sp.from);
  const to = parseYearMonth(sp.to);
  if (brandIds.length === 0 || !from || !to) return null;

  const brandSet = new Set(brandIds);
  const ownBrandIds = parseIdList(sp.own).filter((id) => brandSet.has(id));

  return {
    brandIds,
    ownBrandIds,
    from,
    to,
    regionId: parseOptionalId(sp.regionId),
    communeId: parseOptionalId(sp.communeId),
    typeId: parseOptionalId(sp.typeId),
    providerId: parseOptionalId(sp.providerId),
    categoryId: parseOptionalId(sp.categoryId),
  };
}

/** Espejo de parseBrandReviewSearchParams — misma URL para página y export */
export function toBrandReviewQueryString(f: BrandReviewFilters): string {
  const params = new URLSearchParams();
  params.set('brands', f.brandIds.join(','));
  if (f.ownBrandIds.length) params.set('own', f.ownBrandIds.join(','));
  params.set('from', serializeYearMonth(f.from));
  params.set('to', serializeYearMonth(f.to));
  if (f.regionId) params.set('regionId', String(f.regionId));
  if (f.communeId) params.set('communeId', String(f.communeId));
  if (f.typeId) params.set('typeId', String(f.typeId));
  if (f.providerId) params.set('providerId', String(f.providerId));
  if (f.categoryId) params.set('categoryId', String(f.categoryId));
  return params.toString();
}
