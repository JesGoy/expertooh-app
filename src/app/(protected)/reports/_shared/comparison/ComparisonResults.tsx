import { COMPARISON_RULES } from '@/core/domain/constants/comparison';
import type { ComparisonEntity, ComparisonReviewResult } from '@/core/application/usecases/GetComparisonReview';
import KpiCard from '@/components/reports/KpiCard';
import ChartCard from '@/components/reports/ChartCard';
import LegendChips from '@/components/reports/LegendChips';
import ComparisonTable, { type ComparisonColumn } from '@/components/reports/ComparisonTable';
import PhotoGallery, { type PhotoGroup } from '@/components/reports/PhotoGallery';
import { formatCLP, formatCompact, formatNumber, formatPercent, formatYearMonth } from '@/lib/formatters';
import type { ComparisonReportConfig } from './config';
import ComparisonCharts from './ComparisonCharts';
import type { EntityMeta } from './transforms';

interface ComparisonResultsProps {
  config: ComparisonReportConfig;
  result: ComparisonReviewResult;
  /** entityId -> color (calculado una vez en la página) */
  entityColors: Record<number, string>;
}

function EntityChip({ entity, color }: { entity: ComparisonEntity; color: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} aria-hidden="true" />
      <span className="font-medium text-ink">{entity.entityName}</span>
      {entity.isOwn && <span className="text-[10px] uppercase tracking-wide text-brand">propia</span>}
    </span>
  );
}

function buildComparisonColumns(
  config: ComparisonReportConfig,
  showCategory: boolean,
  entityColors: Record<number, string>,
): ComparisonColumn<ComparisonEntity>[] {
  const columns: ComparisonColumn<ComparisonEntity>[] = [
    { key: 'entity', label: config.columnLabel, render: (e) => <EntityChip entity={e} color={entityColors[e.entityId]} /> },
  ];
  if (showCategory) {
    columns.push({ key: 'category', label: 'Categoría', render: (e) => <span className="text-neutral-500">{e.categoryName ?? '—'}</span> });
  }
  columns.push(
    { key: 'faces', label: 'Caras', align: 'right', render: (e) => formatNumber(e.faces) },
    { key: 'elements', label: 'Soportes', align: 'right', render: (e) => formatNumber(e.elements) },
    { key: 'investment', label: 'Inversión est.', align: 'right', render: (e) => formatCLP(e.investmentCLP) },
    { key: 'area', label: 'm²', align: 'right', render: (e) => formatNumber(e.areaM2) },
    { key: 'audience', label: 'Audiencia', align: 'right', render: (e) => (e.audience > 0 ? formatCompact(e.audience) : '—') },
    { key: 'sovInv', label: 'SOV inversión', align: 'right', render: (e) => <span className="font-medium">{formatPercent(e.share.investmentCLP)}</span> },
    { key: 'sovFaces', label: 'SOV caras', align: 'right', render: (e) => formatPercent(e.share.faces) },
  );
  return columns;
}

function buildAudienceColumns(config: ComparisonReportConfig, entityColors: Record<number, string>): ComparisonColumn<ComparisonEntity>[] {
  return [
    { key: 'entity', label: config.columnLabel, render: (e) => <EntityChip entity={e} color={entityColors[e.entityId]} /> },
    { key: 'audience', label: 'Audiencia', align: 'right', render: (e) => formatCompact(e.audience) },
    { key: 'male', label: 'Hombres', align: 'right', render: (e) => formatPercent(e.audienceProfile?.malePct ?? NaN) },
    { key: 'female', label: 'Mujeres', align: 'right', render: (e) => formatPercent(e.audienceProfile?.femalePct ?? NaN) },
    { key: 'nseHigh', label: 'NSE Alto', align: 'right', render: (e) => formatPercent(e.audienceProfile?.nseHighPct ?? NaN) },
    { key: 'nseMid', label: 'NSE Medio', align: 'right', render: (e) => formatPercent(e.audienceProfile?.nseMidPct ?? NaN) },
    { key: 'nseLow', label: 'NSE Bajo', align: 'right', render: (e) => formatPercent(e.audienceProfile?.nseLowPct ?? NaN) },
  ];
}

export default function ComparisonResults({ config, result, entityColors }: ComparisonResultsProps) {
  const { totals, entities, filters } = result;
  const rules = COMPARISON_RULES[filters.kind];
  const showCategory = filters.kind === 'brand';
  const hasAudience = totals.audience > 0;
  const periodLabel = `${formatYearMonth(filters.from.year, filters.from.month)} — ${formatYearMonth(filters.to.year, filters.to.month)}`;

  const entityMeta: Array<EntityMeta & { metrics: Record<'faces' | 'investmentCLP' | 'areaM2' | 'audience', number> }> =
    entities.map((e) => ({
      entityId: e.entityId,
      name: e.entityName,
      color: entityColors[e.entityId],
      isOwn: e.isOwn,
      metrics: { faces: e.faces, investmentCLP: e.investmentCLP, areaM2: e.areaM2, audience: e.audience },
    }));

  const photoGroups: PhotoGroup[] = entities.map((e) => ({
    brandId: e.entityId,
    brandName: e.entityName,
    color: entityColors[e.entityId],
    photos: result.photos.filter((p) => p.entityId === e.entityId),
  }));

  const audienceEntities = entities.filter((e) => e.audienceProfile !== null);

  if (totals.faces === 0) {
    return (
      <section className="rounded-2xl border border-neutral-200/60 bg-white/70 backdrop-blur p-10 text-center">
        <p className="text-sm text-neutral-600">
          No hay registros para los {config.entityLabels.plural} y filtros seleccionados en {periodLabel}.
        </p>
        <p className="text-xs text-neutral-400 mt-1">Ajusta el período o los filtros e intenta nuevamente.</p>
      </section>
    );
  }

  return (
    <div className="space-y-6" id="comparison-results">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-ink">Resultados · {periodLabel}</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            Share of Voice calculado sobre el set de {entities.length} {config.entityLabels.plural} seleccionado(s)
          </p>
        </div>
        <LegendChips entities={entityMeta.map((e) => ({ entityId: e.entityId, name: e.name, color: e.color, isOwn: e.isOwn }))} />
      </div>

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

      <ComparisonCharts
        entities={entityMeta}
        monthly={result.monthly}
        breakdowns={result.breakdowns}
        from={filters.from}
        to={filters.to}
        hasAudience={hasAudience}
      />

      <ChartCard title={`Comparativa por ${config.entityLabels.singular}`} subtitle="Métricas absolutas y share of voice del período">
        <ComparisonTable
          columns={buildComparisonColumns(config, showCategory, entityColors)}
          rows={entities}
          rowKey={(e) => e.entityId}
        />
      </ChartCard>

      {audienceEntities.length > 0 && (
        <ChartCard
          title="Perfil de audiencia"
          subtitle="Promedios ponderados por audiencia de cada soporte (género y nivel socioeconómico)"
        >
          <ComparisonTable columns={buildAudienceColumns(config, entityColors)} rows={audienceEntities} rowKey={(e) => e.entityId} />
        </ChartCard>
      )}

      {rules.supportsPhotos && (
        <ChartCard title="Evidencia fotográfica" subtitle={`Últimas capturas por ${config.entityLabels.singular} en el período`}>
          <PhotoGallery
            groups={photoGroups}
            emptyMessage="Sin fotografías con URL válida para este período (la evidencia fotográfica está disponible desde 2025)."
          />
        </ChartCard>
      )}
    </div>
  );
}
