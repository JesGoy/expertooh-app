import { InvalidBrandReviewFilters } from '@/core/domain/errors/ReportErrors';
import type {
  BrandGeoRow,
  BrandMetrics,
  BrandMonthRow,
  BrandPhotoRow,
  BrandReviewFilters,
  BrandReviewRepository,
  BrandTotalsRow,
  BrandTypeRow,
  GeoLevel,
  YearMonth,
} from '../ports/BrandReviewRepository';

export const MAX_BRANDS_PER_REVIEW = 8;
export const PHOTOS_PER_BRAND = 6;

export type ShareMetric = 'faces' | 'investmentCLP' | 'areaM2' | 'audience';

export const SHARE_METRICS: ShareMetric[] = ['faces', 'investmentCLP', 'areaM2', 'audience'];

export type BrandReviewBrand = BrandTotalsRow & {
  isOwn: boolean;
  /** Share of Voice 0-1 sobre el total del set seleccionado, por métrica */
  share: Record<ShareMetric, number>;
};

export type BrandReviewResult = {
  filters: BrandReviewFilters;
  /** Totales del set completo (denominador del SOV) */
  totals: BrandMetrics;
  /** Marcas ordenadas: propias primero, luego por inversión desc */
  brands: BrandReviewBrand[];
  monthly: BrandMonthRow[];
  geo: { level: GeoLevel; rows: BrandGeoRow[] };
  formats: BrandTypeRow[];
  photos: BrandPhotoRow[];
};

const EMPTY_METRICS: BrandMetrics = { faces: 0, elements: 0, investmentCLP: 0, areaM2: 0, audience: 0 };

function toComparable(ym: YearMonth): number {
  return ym.year * 100 + ym.month;
}

function isValidYearMonth(ym: YearMonth): boolean {
  return Number.isInteger(ym.year) && Number.isInteger(ym.month) && ym.month >= 1 && ym.month <= 12;
}

export class GetBrandReview {
  constructor(private readonly deps: { repo: BrandReviewRepository }) {}

  async execute(filters: BrandReviewFilters): Promise<BrandReviewResult> {
    this.validate(filters);

    // Con filtro de región se detalla por comuna; sin él, panorama por región
    const geoLevel: GeoLevel = filters.regionId ? 'commune' : 'region';

    const [totalsRows, monthly, geoRows, formats, photos] = await Promise.all([
      this.deps.repo.aggregateByBrand(filters),
      this.deps.repo.aggregateByBrandMonth(filters),
      this.deps.repo.aggregateByBrandGeo(filters, geoLevel),
      this.deps.repo.aggregateByBrandType(filters),
      this.deps.repo.samplePhotos(filters, PHOTOS_PER_BRAND),
    ]);

    const totals = this.sumTotals(totalsRows);
    const brands = this.rankBrands(totalsRows, filters.ownBrandIds, totals);

    return { filters, totals, brands, monthly, geo: { level: geoLevel, rows: geoRows }, formats, photos };
  }

  private validate(filters: BrandReviewFilters): void {
    if (filters.brandIds.length < 1 || filters.brandIds.length > MAX_BRANDS_PER_REVIEW) {
      throw new InvalidBrandReviewFilters(
        `Selecciona entre 1 y ${MAX_BRANDS_PER_REVIEW} marcas para comparar`,
      );
    }
    if (!isValidYearMonth(filters.from) || !isValidYearMonth(filters.to)) {
      throw new InvalidBrandReviewFilters('El período seleccionado no es válido');
    }
    if (toComparable(filters.from) > toComparable(filters.to)) {
      throw new InvalidBrandReviewFilters('El inicio del período debe ser anterior al término');
    }
  }

  private sumTotals(rows: BrandTotalsRow[]): BrandMetrics {
    return rows.reduce<BrandMetrics>(
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

  private rankBrands(
    rows: BrandTotalsRow[],
    ownBrandIds: number[],
    totals: BrandMetrics,
  ): BrandReviewBrand[] {
    const ownSet = new Set(ownBrandIds);
    const share = (value: number, total: number) => (total > 0 ? value / total : 0);

    return rows
      .map((row) => ({
        ...row,
        isOwn: ownSet.has(row.brandId),
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
