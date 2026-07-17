import { redirect } from 'next/navigation';
import { getSession } from '@/infra/security/session';
import { getCachedCommuneCatalog, getCachedReportCatalogs } from '@/infra/container/reports';
import { ROUTES } from '@/lib/routes';
import { canAccessReport } from '../registry';
import { TERRITORY_REVIEW_CONFIG } from '../_shared/comparison/config';
import ComparisonReport from '../_shared/comparison/ComparisonReport';

export const dynamic = 'force-dynamic';

const REPORT_SLUG = 'territory-review';

export default async function TerritoryReviewPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) || {};
  const session = await getSession();
  if (!session) redirect(ROUTES.LOGIN);
  if (!canAccessReport(session.profile, REPORT_SLUG)) redirect(ROUTES.REPORTS);

  const [catalogs, communes] = await Promise.all([getCachedReportCatalogs(), getCachedCommuneCatalog()]);

  return (
    <ComparisonReport
      config={TERRITORY_REVIEW_CONFIG}
      catalogs={catalogs}
      groupsByLevel={{
        region: [
          {
            title: 'Regiones',
            subtitle: 'Todas las regiones del país',
            items: catalogs.regions,
            emptyMessage: 'Sin regiones disponibles.',
          },
        ],
        commune: [
          {
            title: 'Comunas',
            subtitle: 'Todas las comunas del país',
            items: communes,
            emptyMessage: 'Sin comunas disponibles.',
          },
        ],
      }}
      searchParams={sp}
    />
  );
}
