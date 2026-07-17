import type { ComparisonFilters, YearMonth } from '@/core/application/ports/ComparisonReviewRepository';
import { MAX_ENTITIES_PER_COMPARISON } from '@/core/application/usecases/GetComparisonReview';
import type { ComparisonReportConfig } from './config';

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
 * Parsea los searchParams de un reporte de comparación según su config.
 * Devuelve null si aún no hay una selección válida — la página muestra solo
 * los filtros en ese caso. Los filtros de `hiddenFilters` se ignoran aunque
 * vengan en la URL (deep-links viejos no fallan, solo pierden ese filtro).
 */
export function parseComparisonSearchParams(
  config: ComparisonReportConfig,
  sp: SearchParams,
): ComparisonFilters | null {
  const entityIds = parseIdList(sp[config.idsParam]).slice(0, MAX_ENTITIES_PER_COMPARISON);
  const from = parseYearMonth(sp.from);
  const to = parseYearMonth(sp.to);
  if (entityIds.length === 0 || !from || !to) return null;

  const entitySet = new Set(entityIds);
  const ownEntityIds = parseIdList(sp.own).filter((id) => entitySet.has(id));

  const kind =
    config.levels.length > 1
      ? config.levels.find((l) => l.kind === first(sp.level))?.kind ?? config.levels[0].kind
      : config.levels[0].kind;

  const hidden = new Set(config.hiddenFilters);

  return {
    kind,
    entityIds,
    ownEntityIds,
    from,
    to,
    regionId: hidden.has('regionId') ? undefined : parseOptionalId(sp.regionId),
    communeId: hidden.has('communeId') ? undefined : parseOptionalId(sp.communeId),
    typeId: hidden.has('typeId') ? undefined : parseOptionalId(sp.typeId),
    providerId: hidden.has('providerId') ? undefined : parseOptionalId(sp.providerId),
    categoryId: hidden.has('categoryId') ? undefined : parseOptionalId(sp.categoryId),
  };
}

/** Espejo de parseComparisonSearchParams — misma URL para página y export */
export function toComparisonQueryString(config: ComparisonReportConfig, f: ComparisonFilters): string {
  const params = new URLSearchParams();
  params.set(config.idsParam, f.entityIds.join(','));
  if (f.ownEntityIds.length) params.set('own', f.ownEntityIds.join(','));
  params.set('from', serializeYearMonth(f.from));
  params.set('to', serializeYearMonth(f.to));
  if (config.levels.length > 1) params.set('level', f.kind);
  if (f.regionId) params.set('regionId', String(f.regionId));
  if (f.communeId) params.set('communeId', String(f.communeId));
  if (f.typeId) params.set('typeId', String(f.typeId));
  if (f.providerId) params.set('providerId', String(f.providerId));
  if (f.categoryId) params.set('categoryId', String(f.categoryId));
  return params.toString();
}
