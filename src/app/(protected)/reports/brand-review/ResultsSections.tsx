import type { BrandReviewBrand, BrandReviewResult } from '@/core/application/usecases/GetBrandReview';
import KpiCard from '@/components/reports/KpiCard';
import ChartCard from '@/components/reports/ChartCard';
import BrandLegendChips from '@/components/reports/BrandLegendChips';
import ComparisonTable, { type ComparisonColumn } from '@/components/reports/ComparisonTable';
import PhotoGallery, { type PhotoGroup } from '@/components/reports/PhotoGallery';
import { formatCLP, formatCompact, formatNumber, formatPercent, formatYearMonth } from '@/lib/formatters';
import ChartsPanel from './ChartsPanel';
import type { BrandMeta } from './transforms';

interface ResultsSectionsProps {
  result: BrandReviewResult;
  /** brandId -> color (calculado una vez en la página) */
  brandColors: Record<number, string>;
}

function BrandChip({ brand, color }: { brand: BrandReviewBrand; color: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} aria-hidden="true" />
      <span className="font-medium text-ink">{brand.brandName}</span>
      {brand.isOwn && <span className="text-[10px] uppercase tracking-wide text-brand">propia</span>}
    </span>
  );
}

function buildComparisonColumns(brandColors: Record<number, string>): ComparisonColumn<BrandReviewBrand>[] {
  return [
    { key: 'brand', label: 'Marca', render: (b) => <BrandChip brand={b} color={brandColors[b.brandId]} /> },
    { key: 'category', label: 'Categoría', render: (b) => <span className="text-neutral-500">{b.categoryName ?? '—'}</span> },
    { key: 'faces', label: 'Caras', align: 'right', render: (b) => formatNumber(b.faces) },
    { key: 'elements', label: 'Soportes', align: 'right', render: (b) => formatNumber(b.elements) },
    { key: 'investment', label: 'Inversión est.', align: 'right', render: (b) => formatCLP(b.investmentCLP) },
    { key: 'area', label: 'm²', align: 'right', render: (b) => formatNumber(b.areaM2) },
    { key: 'audience', label: 'Audiencia', align: 'right', render: (b) => (b.audience > 0 ? formatCompact(b.audience) : '—') },
    { key: 'sovInv', label: 'SOV inversión', align: 'right', render: (b) => <span className="font-medium">{formatPercent(b.share.investmentCLP)}</span> },
    { key: 'sovFaces', label: 'SOV caras', align: 'right', render: (b) => formatPercent(b.share.faces) },
  ];
}

const AUDIENCE_COLUMNS_BASE: ComparisonColumn<BrandReviewBrand>[] = [
  { key: 'audience', label: 'Audiencia', align: 'right', render: (b) => formatCompact(b.audience) },
  { key: 'male', label: 'Hombres', align: 'right', render: (b) => formatPercent(b.audienceProfile?.malePct ?? NaN) },
  { key: 'female', label: 'Mujeres', align: 'right', render: (b) => formatPercent(b.audienceProfile?.femalePct ?? NaN) },
  { key: 'nseHigh', label: 'NSE Alto', align: 'right', render: (b) => formatPercent(b.audienceProfile?.nseHighPct ?? NaN) },
  { key: 'nseMid', label: 'NSE Medio', align: 'right', render: (b) => formatPercent(b.audienceProfile?.nseMidPct ?? NaN) },
  { key: 'nseLow', label: 'NSE Bajo', align: 'right', render: (b) => formatPercent(b.audienceProfile?.nseLowPct ?? NaN) },
];

export default function ResultsSections({ result, brandColors }: ResultsSectionsProps) {
  const { totals, brands, filters } = result;
  const hasAudience = totals.audience > 0;
  const periodLabel = `${formatYearMonth(filters.from.year, filters.from.month)} — ${formatYearMonth(filters.to.year, filters.to.month)}`;

  const brandMeta: Array<BrandMeta & { metrics: Record<'faces' | 'investmentCLP' | 'areaM2' | 'audience', number> }> =
    brands.map((b) => ({
      brandId: b.brandId,
      name: b.brandName,
      color: brandColors[b.brandId],
      isOwn: b.isOwn,
      metrics: { faces: b.faces, investmentCLP: b.investmentCLP, areaM2: b.areaM2, audience: b.audience },
    }));

  const photoGroups: PhotoGroup[] = brands.map((b) => ({
    brandId: b.brandId,
    brandName: b.brandName,
    color: brandColors[b.brandId],
    photos: result.photos.filter((p) => p.brandId === b.brandId),
  }));

  const audienceBrands = brands.filter((b) => b.audienceProfile !== null);

  if (totals.faces === 0) {
    return (
      <section className="rounded-2xl border border-neutral-200/60 bg-white/70 backdrop-blur p-10 text-center">
        <p className="text-sm text-neutral-600">
          No hay registros para las marcas y filtros seleccionados en {periodLabel}.
        </p>
        <p className="text-xs text-neutral-400 mt-1">Ajusta el período o los filtros e intenta nuevamente.</p>
      </section>
    );
  }

  return (
    <div className="space-y-6" id="brand-review-results">
      {/* Encabezado del reporte + leyenda */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-ink">Resultados · {periodLabel}</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Share of Voice calculado sobre el set de {brands.length} marca(s) seleccionada(s)
          </p>
        </div>
        <BrandLegendChips
          brands={brandMeta.map((b) => ({ brandId: b.brandId, name: b.name, color: b.color, isOwn: b.isOwn }))}
        />
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <KpiCard label="Caras observadas" value={formatNumber(totals.faces)} />
        <KpiCard label="Soportes únicos" value={formatNumber(totals.elements)} />
        <KpiCard label="Inversión estimada" value={formatCLP(totals.investmentCLP)} />
        <KpiCard label="Superficie total" value={`${formatNumber(totals.areaM2)} m²`} />
        <KpiCard
          label="Audiencia estimada"
          value={hasAudience ? formatCompact(totals.audience) : '—'}
          sublabel={hasAudience ? undefined : 'Sin datos en el período'}
        />
      </section>

      {/* Charts con tabs de métrica */}
      <ChartsPanel
        brands={brandMeta}
        monthly={result.monthly}
        geoRows={result.geo.rows}
        geoLevel={result.geo.level}
        formatRows={result.formats}
        from={filters.from}
        to={filters.to}
        hasAudience={hasAudience}
      />

      {/* Tabla comparativa */}
      <ChartCard title="Comparativa por marca" subtitle="Métricas absolutas y share of voice del período">
        <ComparisonTable
          columns={buildComparisonColumns(brandColors)}
          rows={brands}
          rowKey={(b) => b.brandId}
        />
      </ChartCard>

      {/* Perfil de audiencia (solo si hay data) */}
      {audienceBrands.length > 0 && (
        <ChartCard
          title="Perfil de audiencia"
          subtitle="Promedios ponderados por audiencia de cada soporte (género y nivel socioeconómico)"
        >
          <ComparisonTable
            columns={[
              {
                key: 'brand',
                label: 'Marca',
                render: (b: BrandReviewBrand) => <BrandChip brand={b} color={brandColors[b.brandId]} />,
              },
              ...AUDIENCE_COLUMNS_BASE,
            ]}
            rows={audienceBrands}
            rowKey={(b) => b.brandId}
          />
        </ChartCard>
      )}

      {/* Evidencia fotográfica */}
      <ChartCard title="Evidencia fotográfica" subtitle="Últimas capturas por marca en el período">
        <PhotoGallery
          groups={photoGroups}
          emptyMessage="Sin fotografías con URL válida para este período (la evidencia fotográfica está disponible desde 2025)."
        />
      </ChartCard>
    </div>
  );
}
