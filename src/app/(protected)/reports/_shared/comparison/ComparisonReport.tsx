import { Suspense } from 'react';
import Link from 'next/link';
import type { ComparisonEntityKind } from '@/core/domain/constants/comparison';
import { InvalidComparisonFilters } from '@/core/domain/errors/ReportErrors';
import type { ComparisonFilters } from '@/core/application/ports/ComparisonReviewRepository';
import type { ReportCatalogs } from '@/core/application/ports/ReportCatalogsRepository';
import { makeGetComparisonReview } from '@/infra/container/reports';
import { API_ROUTES, ROUTES } from '@/lib/routes';
import { assignSeriesColors } from '@/styles/chartPalette';
import { findReport } from '../../registry';
import type { ComparisonReportConfig } from './config';
import { parseComparisonSearchParams, serializeYearMonth, toComparisonQueryString } from './searchParams';
import ComparisonFiltersPanel, { type EntityPickerGroup } from './ComparisonFiltersPanel';
import ComparisonResults from './ComparisonResults';
import PrintableReport from './PrintableReport';
import './print.css';

type SearchParams = Record<string, string | string[] | undefined>;

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

async function ReportContent({
  config,
  filters,
}: {
  config: ComparisonReportConfig;
  filters: ComparisonFilters;
}) {
  try {
    const result = await makeGetComparisonReview().execute(filters);
    const colorMap = assignSeriesColors(
      result.entities.map((e) => ({ entityId: e.entityId, name: e.entityName, isOwn: e.isOwn })),
    );
    const documentTitle = `${config.slug}_${serializeYearMonth(filters.from)}_${serializeYearMonth(filters.to)}`;
    const exportHref = `${API_ROUTES.reportExport(config.slug)}?${toComparisonQueryString(config, filters)}`;

    return (
      <PrintableReport exportHref={exportHref} documentTitle={documentTitle}>
        <ComparisonResults config={config} result={result} entityColors={Object.fromEntries(colorMap)} />
      </PrintableReport>
    );
  } catch (err) {
    if (err instanceof InvalidComparisonFilters) {
      return (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
          {err.message}
        </section>
      );
    }
    throw err;
  }
}

interface ComparisonReportProps {
  config: ComparisonReportConfig;
  catalogs: ReportCatalogs;
  groupsByLevel: Partial<Record<ComparisonEntityKind, EntityPickerGroup[]>>;
  searchParams: SearchParams;
}

/** Shell RSC compartido por los 4 reportes de comparación (Marcas/Formatos/Territorios/Categorías) */
export default async function ComparisonReport({
  config,
  catalogs,
  groupsByLevel,
  searchParams,
}: ComparisonReportProps) {
  const report = findReport(config.slug);
  const filters = parseComparisonSearchParams(config, searchParams);
  const queryString = filters ? toComparisonQueryString(config, filters) : '';

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
            <span className="text-neutral-600">{report?.title}</span>
          </nav>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">{report?.title}</h1>
          <p className="mt-1 text-sm text-neutral-500">{report?.description}</p>
        </header>

        <ComparisonFiltersPanel
          config={config}
          catalogs={catalogs}
          groupsByLevel={groupsByLevel}
          initialFilters={filters}
          defaultFrom={defaultFrom}
          defaultTo={defaultTo}
        />

        {filters && (
          <Suspense key={queryString} fallback={<ReportSkeleton />}>
            <ReportContent config={config} filters={filters} />
          </Suspense>
        )}
      </div>
    </main>
  );
}
