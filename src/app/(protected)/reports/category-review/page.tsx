import { redirect } from 'next/navigation';
import { getSession } from '@/infra/security/session';
import { getCachedReportCatalogs } from '@/infra/container/reports';
import { ROUTES } from '@/lib/routes';
import { canAccessReport } from '../registry';
import { CATEGORY_REVIEW_CONFIG } from '../_shared/comparison/config';
import ComparisonReport from '../_shared/comparison/ComparisonReport';

export const dynamic = 'force-dynamic';

const REPORT_SLUG = 'category-review';

export default async function CategoryReviewPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) || {};
  const session = await getSession();
  if (!session) redirect(ROUTES.LOGIN);
  if (!canAccessReport(session.profile, REPORT_SLUG)) redirect(ROUTES.REPORTS);

  const catalogs = await getCachedReportCatalogs();

  return (
    <ComparisonReport
      config={CATEGORY_REVIEW_CONFIG}
      catalogs={catalogs}
      groupsByLevel={{
        category: [
          {
            title: 'Categorías disponibles',
            subtitle: 'Todas las categorías monitoreadas',
            items: catalogs.categories,
            emptyMessage: 'Sin categorías disponibles.',
          },
        ],
      }}
      searchParams={sp}
    />
  );
}
