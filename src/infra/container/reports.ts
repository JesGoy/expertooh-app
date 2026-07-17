import { unstable_cache } from 'next/cache';
import { GetComparisonReview } from '@/core/application/usecases/GetComparisonReview';
import { ComparisonReviewRepositoryDrizzle } from '@/infra/repositories/ComparisonReviewRepositoryDrizzle';
import { ReportCatalogsRepositoryDrizzle } from '@/infra/repositories/ReportCatalogsRepositoryDrizzle';
import type { CatalogItem, ReportCatalogs } from '@/core/application/ports/ReportCatalogsRepository';

const CATALOGS_REVALIDATE_SECONDS = 3600;

export function makeGetComparisonReview() {
  const repo = new ComparisonReviewRepositoryDrizzle();
  return new GetComparisonReview({ repo });
}

/** Catálogos de dimensiones para filtros, cacheados (casi estáticos) */
export const getCachedReportCatalogs: () => Promise<ReportCatalogs> = unstable_cache(
  async () => {
    const repo = new ReportCatalogsRepositoryDrizzle();
    return repo.getCatalogs();
  },
  ['report-catalogs'],
  { revalidate: CATALOGS_REVALIDATE_SECONDS },
);

/** Catálogo de comunas (~345 ítems): cache separado, solo lo paga el reporte de Territorios */
export const getCachedCommuneCatalog: () => Promise<CatalogItem[]> = unstable_cache(
  async () => {
    const repo = new ReportCatalogsRepositoryDrizzle();
    return repo.getCommunes();
  },
  ['report-catalog-communes'],
  { revalidate: CATALOGS_REVALIDATE_SECONDS },
);
