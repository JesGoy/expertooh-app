import type {
  BrandGeoRow,
  BrandMonthRow,
  BrandTypeRow,
  YearMonth,
} from '@/core/application/ports/BrandReviewRepository';
import type { ShareMetric } from '@/core/application/usecases/GetBrandReview';
import { formatCLP, formatCompact, formatNumber, formatYearMonth } from '@/lib/formatters';
import type { ChartSeries } from '@/components/charts/TrendChart';
import type { DonutSlice } from '@/components/charts/SovDonut';

/** Metadata serializable de cada marca del set (para client components) */
export interface BrandMeta {
  brandId: number;
  name: string;
  color: string;
  isOwn: boolean;
}

export const METRIC_OPTIONS: Array<{ key: ShareMetric; label: string }> = [
  { key: 'faces', label: 'Caras' },
  { key: 'investmentCLP', label: 'Inversión' },
  { key: 'areaM2', label: 'm²' },
  { key: 'audience', label: 'Audiencia' },
];

export const METRIC_TOOLTIP_FORMATTERS: Record<ShareMetric, (v: number) => string> = {
  faces: formatNumber,
  investmentCLP: formatCLP,
  areaM2: (v) => `${formatNumber(v)} m²`,
  audience: formatCompact,
};

export const METRIC_AXIS_FORMATTERS: Record<ShareMetric, (v: number) => string> = {
  faces: formatCompact,
  investmentCLP: formatCompact,
  areaM2: formatCompact,
  audience: formatCompact,
};

/** Máximo de zonas geográficas mostradas en el chart (las de mayor volumen) */
const MAX_GEO_BARS = 8;

function seriesKey(brandId: number): string {
  return `b${brandId}`;
}

export function toChartSeries(brands: BrandMeta[]): ChartSeries[] {
  return brands.map((b) => ({ key: seriesKey(b.brandId), name: b.name, color: b.color }));
}

export function toDonutData(
  brands: Array<BrandMeta & { value: number }>,
): DonutSlice[] {
  return brands.map((b) => ({ name: b.name, value: b.value, color: b.color }));
}

/** Lista de meses year-month entre from y to (inclusive) */
function monthRange(from: YearMonth, to: YearMonth): YearMonth[] {
  const months: YearMonth[] = [];
  let { year, month } = from;
  while (year * 100 + month <= to.year * 100 + to.month) {
    months.push({ year, month });
    month++;
    if (month > 12) {
      month = 1;
      year++;
    }
  }
  return months;
}

/** Serie mensual por marca, rellenando con 0 los meses sin datos */
export function toTrendData(
  monthly: BrandMonthRow[],
  brands: BrandMeta[],
  metric: ShareMetric,
  from: YearMonth,
  to: YearMonth,
): Array<Record<string, number | string>> {
  const byBrandMonth = new Map<string, number>();
  for (const row of monthly) {
    byBrandMonth.set(`${row.brandId}:${row.year}-${row.month}`, row[metric]);
  }
  return monthRange(from, to).map(({ year, month }) => {
    const point: Record<string, number | string> = { label: formatYearMonth(year, month) };
    for (const brand of brands) {
      point[seriesKey(brand.brandId)] = byBrandMonth.get(`${brand.brandId}:${year}-${month}`) ?? 0;
    }
    return point;
  });
}

/** Barras agrupadas por zona geográfica (top N por volumen total) */
export function toGeoData(
  geoRows: BrandGeoRow[],
  brands: BrandMeta[],
  metric: ShareMetric,
): Array<Record<string, number | string>> {
  const byGeo = new Map<number, { name: string; total: number; perBrand: Map<number, number> }>();
  for (const row of geoRows) {
    const entry = byGeo.get(row.geoId) ?? { name: row.geoName, total: 0, perBrand: new Map() };
    entry.total += row[metric];
    entry.perBrand.set(row.brandId, (entry.perBrand.get(row.brandId) ?? 0) + row[metric]);
    byGeo.set(row.geoId, entry);
  }
  return [...byGeo.values()]
    .sort((a, b) => b.total - a.total)
    .slice(0, MAX_GEO_BARS)
    .map((entry) => {
      const point: Record<string, number | string> = { label: entry.name };
      for (const brand of brands) {
        point[seriesKey(brand.brandId)] = entry.perBrand.get(brand.brandId) ?? 0;
      }
      return point;
    });
}

/** Barras apiladas: formato en X, composición por marca (colores de marca) */
export function toFormatData(
  formatRows: BrandTypeRow[],
  brands: BrandMeta[],
  metric: ShareMetric,
): Array<Record<string, number | string>> {
  const byType = new Map<number, { name: string; total: number; perBrand: Map<number, number> }>();
  for (const row of formatRows) {
    const entry = byType.get(row.typeId) ?? { name: row.typeName, total: 0, perBrand: new Map() };
    entry.total += row[metric];
    entry.perBrand.set(row.brandId, (entry.perBrand.get(row.brandId) ?? 0) + row[metric]);
    byType.set(row.typeId, entry);
  }
  return [...byType.values()]
    .sort((a, b) => b.total - a.total)
    .map((entry) => {
      const point: Record<string, number | string> = { label: entry.name };
      for (const brand of brands) {
        point[seriesKey(brand.brandId)] = entry.perBrand.get(brand.brandId) ?? 0;
      }
      return point;
    });
}
