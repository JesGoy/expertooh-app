import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/infra/security/session';
import { makeAgencyBrandUseCases } from '@/infra/container/auth';
import { getCachedReportCatalogs, makeGetBrandReview } from '@/infra/container/reports';
import type { BrandReviewFilters } from '@/core/application/ports/BrandReviewRepository';
import { InvalidBrandReviewFilters } from '@/core/domain/errors/ReportErrors';
import { USER_PROFILES } from '@/core/domain/constants/profiles';
import { ROUTES } from '@/lib/routes';
import { assignBrandColors } from '@/styles/chartPalette';
import { canAccessReport } from '../registry';
import { parseBrandReviewSearchParams, serializeYearMonth, toBrandReviewQueryString } from './searchParams';
import FiltersPanel from './FiltersPanel';
import ResultsSections from './ResultsSections';
import PrintableReport from './PrintableReport';
import './print.css';

export const dynamic = 'force-dynamic';

const REPORT_SLUG = 'brand-review';
/** Marcas cargadas para el picker (búsqueda client-side sobre esta lista) */
const BRAND_PICKER_LIMIT = 2000;

function ReportSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-neutral-100" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-80 rounded-2xl bg-neutral-100" />
        <div className="h-80 rounded-2xl bg-neutral-100" />
      </div>
      <p className="text-center text-sm text-neutral-400">Generando reporte…</p>
    </div>
  );
}

async function ReportContent({ filters }: { filters: BrandReviewFilters }) {
  try {
    const result = await makeGetBrandReview().execute(filters);
    const colorMap = assignBrandColors(
      result.brands.map((b) => ({ brandId: b.brandId, brandName: b.brandName, isOwn: b.isOwn })),
    );
    const documentTitle = `brand-review_${serializeYearMonth(filters.from)}_${serializeYearMonth(filters.to)}`;

    return (
      <PrintableReport queryString={toBrandReviewQueryString(filters)} documentTitle={documentTitle}>
        <ResultsSections result={result} brandColors={Object.fromEntries(colorMap)} />
      </PrintableReport>
    );
  } catch (err) {
    if (err instanceof InvalidBrandReviewFilters) {
      return (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {err.message}
        </section>
      );
    }
    throw err;
  }
}

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

  const filters = parseBrandReviewSearchParams(sp);
  const queryString = filters ? toBrandReviewQueryString(filters) : '';

  // Defaults del período: todo el histórico disponible hasta el mes actual
  const now = new Date();
  const defaultFrom = '2021-01';
  const defaultTo = serializeYearMonth({ year: now.getFullYear(), month: now.getMonth() + 1 });

  return (
    <main className="min-h-[100dvh] bg-gradient-to-b from-white to-neutral-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-6">
        <header className="print-hidden">
          <nav className="text-xs text-neutral-400 mb-1">
            <Link href={ROUTES.REPORTS} className="hover:text-neutral-600 transition-colors">
              Reportes
            </Link>
            {' / '}
            <span className="text-neutral-600">Brand Review</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">Brand Review</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Inteligencia competitiva OOH: compara presencia, inversión estimada, cobertura y audiencia entre marcas.
          </p>
        </header>

        <FiltersPanel
          catalogs={catalogs}
          myBrands={brandSets.mine}
          otherBrands={brandSets.others}
          isAgency={isAgency}
          initialFilters={filters}
          defaultFrom={defaultFrom}
          defaultTo={defaultTo}
        />

        {filters && (
          <Suspense key={queryString} fallback={<ReportSkeleton />}>
            <ReportContent filters={filters} />
          </Suspense>
        )}
      </div>
    </main>
  );
}
