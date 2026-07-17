import {
  COMPARISON_RULES,
  type BreakdownSlot,
  type ComparisonBreakdown,
} from '@/core/domain/constants/comparison';
import { InvalidComparisonFilters } from '@/core/domain/errors/ReportErrors';
import type {
  ComparisonFilters,
  ComparisonMetrics,
  ComparisonReviewRepository,
  EntityBreakdownRow,
  EntityMonthRow,
  EntityPhotoRow,
  EntityTotalsRow,
  YearMonth,
} from '../ports/ComparisonReviewRepository';

/** Límite duro: la paleta categórica de charts tiene 8 colores */
export const MAX_ENTITIES_PER_COMPARISON = 8;
export const PHOTOS_PER_ENTITY = 6;

export type ShareMetric = 'faces' | 'investmentCLP' | 'areaM2' | 'audience';

export const SHARE_METRICS: ShareMetric[] = ['faces', 'investmentCLP', 'areaM2', 'audience'];

export type ComparisonEntity = EntityTotalsRow & {
  isOwn: boolean;
  /** Share of Voice 0-1 sobre el total del set seleccionado, por métrica */
  share: Record<ShareMetric, number>;
};

export type ComparisonBreakdownResult = { kind: ComparisonBreakdown; rows: EntityBreakdownRow[] };

export type ComparisonReviewResult = {
  filters: ComparisonFilters;
  /** Totales del set completo (denominador del SOV) */
  totals: ComparisonMetrics;
  /** Entidades ordenadas: propias primero, luego por inversión desc */
  entities: ComparisonEntity[];
  monthly: EntityMonthRow[];
  breakdowns: [ComparisonBreakdownResult, ComparisonBreakdownResult];
  /** Vacío si la dimensión no soporta evidencia fotográfica */
  photos: EntityPhotoRow[];
};

const EMPTY_METRICS: ComparisonMetrics = {
  faces: 0,
  elements: 0,
  investmentCLP: 0,
  areaM2: 0,
  audience: 0,
};

function toComparable(ym: YearMonth): number {
  return ym.year * 100 + ym.month;
}

function isValidYearMonth(ym: YearMonth): boolean {
  return Number.isInteger(ym.year) && Number.isInteger(ym.month) && ym.month >= 1 && ym.month <= 12;
}

/** Con filtro de región el detalle geográfico baja a comuna; sin él, panorama por región */
function resolveBreakdown(slot: BreakdownSlot, filters: ComparisonFilters): ComparisonBreakdown {
  if (slot !== 'geo') return slot;
  return filters.regionId ? 'commune' : 'region';
}

export class GetComparisonReview {
  constructor(private readonly deps: { repo: ComparisonReviewRepository }) {}

  async execute(filters: ComparisonFilters): Promise<ComparisonReviewResult> {
    this.validate(filters);
    const rules = COMPARISON_RULES[filters.kind];
    const breakdownKinds = rules.breakdowns.map((slot) => resolveBreakdown(slot, filters));

    const [totalsRows, monthly, firstRows, secondRows, photos] = await Promise.all([
      this.deps.repo.aggregateTotals(filters),
      this.deps.repo.aggregateByMonth(filters),
      this.deps.repo.aggregateByBreakdown(filters, breakdownKinds[0]),
      this.deps.repo.aggregateByBreakdown(filters, breakdownKinds[1]),
      rules.supportsPhotos
        ? this.deps.repo.samplePhotos(filters, PHOTOS_PER_ENTITY)
        : Promise.resolve<EntityPhotoRow[]>([]),
    ]);

    const totals = this.sumTotals(totalsRows);
    const entities = this.rankEntities(totalsRows, filters.ownEntityIds, totals);

    return {
      filters,
      totals,
      entities,
      monthly,
      breakdowns: [
        { kind: breakdownKinds[0], rows: firstRows },
        { kind: breakdownKinds[1], rows: secondRows },
      ],
      photos,
    };
  }

  private validate(filters: ComparisonFilters): void {
    if (filters.entityIds.length < 1 || filters.entityIds.length > MAX_ENTITIES_PER_COMPARISON) {
      throw new InvalidComparisonFilters(
        `Selecciona entre 1 y ${MAX_ENTITIES_PER_COMPARISON} elementos para comparar`,
      );
    }
    if (!isValidYearMonth(filters.from) || !isValidYearMonth(filters.to)) {
      throw new InvalidComparisonFilters('El período seleccionado no es válido');
    }
    if (toComparable(filters.from) > toComparable(filters.to)) {
      throw new InvalidComparisonFilters('El inicio del período debe ser anterior al término');
    }
    const conflicting = COMPARISON_RULES[filters.kind].conflictingFilters.filter(
      (key) => filters[key] !== undefined,
    );
    if (conflicting.length > 0) {
      throw new InvalidComparisonFilters('No se puede filtrar por la dimensión comparada');
    }
  }

  private sumTotals(rows: EntityTotalsRow[]): ComparisonMetrics {
    return rows.reduce<ComparisonMetrics>(
      (acc, r) => ({
        faces: acc.faces + r.faces,
        elements: acc.elements + r.elements,
        investmentCLP: acc.investmentCLP + r.investmentCLP,
        areaM2: acc.areaM2 + r.areaM2,
        audience: acc.audience + r.audience,
      }),
      { ...EMPTY_METRICS },
    );
  }

  private rankEntities(
    rows: EntityTotalsRow[],
    ownEntityIds: number[],
    totals: ComparisonMetrics,
  ): ComparisonEntity[] {
    const ownSet = new Set(ownEntityIds);
    const share = (value: number, total: number) => (total > 0 ? value / total : 0);

    return rows
      .map((row) => ({
        ...row,
        isOwn: ownSet.has(row.entityId),
        share: {
          faces: share(row.faces, totals.faces),
          investmentCLP: share(row.investmentCLP, totals.investmentCLP),
          areaM2: share(row.areaM2, totals.areaM2),
          audience: share(row.audience, totals.audience),
        },
      }))
      .sort((a, b) => {
        if (a.isOwn !== b.isOwn) return a.isOwn ? -1 : 1;
        return b.investmentCLP - a.investmentCLP;
      });
  }
}
