import type {
  EntityBreakdownRow,
  EntityMonthRow,
  YearMonth,
} from '@/core/application/ports/ComparisonReviewRepository';
import type { ShareMetric } from '@/core/application/usecases/GetComparisonReview';
import { formatYearMonth } from '@/lib/formatters';
import type { ChartSeries } from '@/components/charts/TrendChart';
import type { DonutSlice } from '@/components/charts/SovDonut';

/** Metadata serializable de cada entidad del set (para client components) */
export interface EntityMeta {
  entityId: number;
  name: string;
  color: string;
  isOwn: boolean;
}

function seriesKey(entityId: number): string {
  return `e${entityId}`;
}

export function toChartSeries(entities: EntityMeta[]): ChartSeries[] {
  return entities.map((e) => ({ key: seriesKey(e.entityId), name: e.name, color: e.color }));
}

export function toDonutData(entities: Array<EntityMeta & { value: number }>): DonutSlice[] {
  return entities.map((e) => ({ name: e.name, value: e.value, color: e.color }));
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

/** Serie mensual por entidad, rellenando con 0 los meses sin datos */
export function toTrendData(
  monthly: EntityMonthRow[],
  entities: EntityMeta[],
  metric: ShareMetric,
  from: YearMonth,
  to: YearMonth,
): Array<Record<string, number | string>> {
  const byEntityMonth = new Map<string, number>();
  for (const row of monthly) {
    byEntityMonth.set(`${row.entityId}:${row.year}-${row.month}`, row[metric]);
  }
  return monthRange(from, to).map(({ year, month }) => {
    const point: Record<string, number | string> = { label: formatYearMonth(year, month) };
    for (const entity of entities) {
      point[seriesKey(entity.entityId)] = byEntityMonth.get(`${entity.entityId}:${year}-${month}`) ?? 0;
    }
    return point;
  });
}

/**
 * Barras por breakdown (geo/formato/categoría). `maxBars` limita a las de
 * mayor volumen total (usado para el breakdown geográfico, top 8).
 */
export function toBreakdownData(
  rows: EntityBreakdownRow[],
  entities: EntityMeta[],
  metric: ShareMetric,
  maxBars?: number,
): Array<Record<string, number | string>> {
  const byBreakdown = new Map<number, { name: string; total: number; perEntity: Map<number, number> }>();
  for (const row of rows) {
    const entry = byBreakdown.get(row.breakdownId) ?? { name: row.breakdownName, total: 0, perEntity: new Map() };
    entry.total += row[metric];
    entry.perEntity.set(row.entityId, (entry.perEntity.get(row.entityId) ?? 0) + row[metric]);
    byBreakdown.set(row.breakdownId, entry);
  }
  const sorted = [...byBreakdown.values()].sort((a, b) => b.total - a.total);
  const limited = maxBars ? sorted.slice(0, maxBars) : sorted;
  return limited.map((entry) => {
    const point: Record<string, number | string> = { label: entry.name };
    for (const entity of entities) {
      point[seriesKey(entity.entityId)] = entry.perEntity.get(entity.entityId) ?? 0;
    }
    return point;
  });
}
