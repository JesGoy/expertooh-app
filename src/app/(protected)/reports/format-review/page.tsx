import { redirect } from 'next/navigation';
import { getSession } from '@/infra/security/session';
import { getCachedReportCatalogs } from '@/infra/container/reports';
import { ROUTES } from '@/lib/routes';
import { canAccessReport } from '../registry';
import { FORMAT_REVIEW_CONFIG } from '../_shared/comparison/config';
import ComparisonReport from '../_shared/comparison/ComparisonReport';

export const dynamic = 'force-dynamic';

const REPORT_SLUG = 'format-review';

export default async function FormatReviewPage({
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
      config={FORMAT_REVIEW_CONFIG}
      catalogs={catalogs}
      groupsByLevel={{
        type: [
          {
            title: 'Formatos disponibles',
            subtitle: 'Todos los tipos de elemento monitoreados',
            items: catalogs.types,
            emptyMessage: 'Sin formatos disponibles.',
          },
        ],
      }}
      searchParams={sp}
    />
  );
}
