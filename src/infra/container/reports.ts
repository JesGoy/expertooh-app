import { unstable_cache } from 'next/cache';
import { GetBrandReview } from '@/core/application/usecases/GetBrandReview';
import { BrandReviewRepositoryDrizzle } from '@/infra/repositories/BrandReviewRepositoryDrizzle';
import { ReportCatalogsRepositoryDrizzle } from '@/infra/repositories/ReportCatalogsRepositoryDrizzle';
import type { ReportCatalogs } from '@/core/application/ports/ReportCatalogsRepository';

const CATALOGS_REVALIDATE_SECONDS = 3600;

export function makeGetBrandReview() {
  const repo = new BrandReviewRepositoryDrizzle();
  return new GetBrandReview({ repo });
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
