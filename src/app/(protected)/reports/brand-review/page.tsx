import { redirect } from 'next/navigation';
import { getSession } from '@/infra/security/session';
import { makeAgencyBrandUseCases } from '@/infra/container/auth';
import { getCachedReportCatalogs } from '@/infra/container/reports';
import { USER_PROFILES } from '@/core/domain/constants/profiles';
import { ROUTES } from '@/lib/routes';
import { canAccessReport } from '../registry';
import { BRAND_REVIEW_CONFIG } from '../_shared/comparison/config';
import ComparisonReport from '../_shared/comparison/ComparisonReport';
import { assignBrandAction, unassignBrandAction } from './actions';

export const dynamic = 'force-dynamic';

const REPORT_SLUG = 'brand-review';
/** Marcas cargadas para el picker (búsqueda client-side sobre esta lista) */
const BRAND_PICKER_LIMIT = 2000;

export default async function BrandReviewPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = (await searchParams) || {};
  const session = await getSession();
  if (!session) redirect(ROUTES.LOGIN);
  if (!canAccessReport(session.profile, REPORT_SLUG)) redirect(ROUTES.REPORTS);

  const isAgency = session.profile === USER_PROFILES.AGENCIA;
  const { getSets, searchBrands } = makeAgencyBrandUseCases();

  const [catalogs, brandSets] = await Promise.all([
    getCachedReportCatalogs(),
    isAgency
      ? getSets.execute(session.userId, undefined, BRAND_PICKER_LIMIT)
      : searchBrands.execute(undefined, BRAND_PICKER_LIMIT).then((all) => ({ mine: [], others: all })),
  ]);

  return (
    <ComparisonReport
      config={BRAND_REVIEW_CONFIG}
      catalogs={catalogs}
      groupsByLevel={{
        brand: [
          {
            title: 'Mis marcas',
            subtitle: isAgency ? 'Marcas asignadas a tu agencia' : 'Solo disponible para perfil agencia',
            items: brandSets.mine.map((b) => ({ id: b.id, name: b.name, detail: b.categoryName })),
            emptyMessage: isAgency
              ? 'Aún no tienes marcas asignadas. Fija marcas desde la lista de la derecha.'
              : 'Selecciona marcas desde la lista de la derecha.',
            isOwnGroup: true,
            starAction: isAgency ? unassignBrandAction : undefined,
            starLabel: isAgency ? 'Quitar' : undefined,
          },
          {
            title: 'Marcas competidoras',
            subtitle: 'Todas las marcas monitoreadas',
            items: brandSets.others.map((b) => ({ id: b.id, name: b.name, detail: b.categoryName })),
            emptyMessage: 'Sin marcas disponibles.',
            starAction: isAgency ? assignBrandAction : undefined,
            starLabel: isAgency ? 'Fijar como mía' : undefined,
          },
        ],
      }}
      searchParams={sp}
    />
  );
}
