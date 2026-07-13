'use client';

import { useMemo, useState } from 'react';
import type {
  BrandGeoRow,
  BrandMonthRow,
  BrandTypeRow,
  YearMonth,
} from '@/core/application/ports/BrandReviewRepository';
import type { ShareMetric } from '@/core/application/usecases/GetBrandReview';
import ChartCard from '@/components/reports/ChartCard';
import SovDonut from '@/components/charts/SovDonut';
import TrendChart from '@/components/charts/TrendChart';
import GroupedBarChart from '@/components/charts/GroupedBarChart';
import StackedBarChart from '@/components/charts/StackedBarChart';
import { cn } from '@/lib/utils';
import {
  type BrandMeta,
  METRIC_AXIS_FORMATTERS,
  METRIC_OPTIONS,
  METRIC_TOOLTIP_FORMATTERS,
  toChartSeries,
  toDonutData,
  toFormatData,
  toGeoData,
  toTrendData,
} from './transforms';

interface ChartsPanelProps {
  brands: Array<BrandMeta & { metrics: Record<ShareMetric, number> }>;
  monthly: BrandMonthRow[];
  geoRows: BrandGeoRow[];
  geoLevel: 'region' | 'commune';
  formatRows: BrandTypeRow[];
  from: YearMonth;
  to: YearMonth;
  hasAudience: boolean;
}

function MetricTabs({
  active,
  onChange,
  hasAudience,
}: {
  active: ShareMetric;
  onChange: (m: ShareMetric) => void;
  hasAudience: boolean;
}) {
  return (
    <div className="inline-flex rounded-xl border border-neutral-200 bg-white p-1 print-hidden" role="tablist">
      {METRIC_OPTIONS.map((option) => {
        const disabled = option.key === 'audience' && !hasAudience;
        return (
          <button
            key={option.key}
            role="tab"
            aria-selected={active === option.key}
            disabled={disabled}
            onClick={() => onChange(option.key)}
            title={disabled ? 'Sin datos de audiencia en el período' : undefined}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
              active === option.key
                ? 'bg-brand text-white'
                : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50',
              disabled && 'opacity-40 cursor-not-allowed hover:bg-transparent',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default function ChartsPanel({
  brands,
  monthly,
  geoRows,
  geoLevel,
  formatRows,
  from,
  to,
  hasAudience,
}: ChartsPanelProps) {
  const [metric, setMetric] = useState<ShareMetric>('faces');

  const activeLabel = METRIC_OPTIONS.find((m) => m.key === metric)?.label ?? '';
  const tooltipFormatter = METRIC_TOOLTIP_FORMATTERS[metric];
  const axisFormatter = METRIC_AXIS_FORMATTERS[metric];
  const series = useMemo(() => toChartSeries(brands), [brands]);

  const donutData = useMemo(
    () => toDonutData(brands.map((b) => ({ ...b, value: b.metrics[metric] }))),
    [brands, metric],
  );
  const trendData = useMemo(
    () => toTrendData(monthly, brands, metric, from, to),
    [monthly, brands, metric, from, to],
  );
  const geoData = useMemo(() => toGeoData(geoRows, brands, metric), [geoRows, brands, metric]);
  const formatData = useMemo(
    () => toFormatData(formatRows, brands, metric),
    [formatRows, brands, metric],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-base font-semibold text-ink">Comparativa por métrica</h2>
        <MetricTabs active={metric} onChange={setMetric} hasAudience={hasAudience} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title={`Share of Voice — ${activeLabel}`} subtitle="Participación sobre el set seleccionado">
          <SovDonut data={donutData} centerLabel={activeLabel} valueFormatter={tooltipFormatter} />
        </ChartCard>
        <ChartCard title={`Tendencia mensual — ${activeLabel}`} subtitle="Evolución en el período">
          <TrendChart data={trendData} series={series} valueFormatter={axisFormatter} />
        </ChartCard>
        <ChartCard
          title={`Distribución geográfica — ${activeLabel}`}
          subtitle={geoLevel === 'region' ? 'Por región (top 8)' : 'Por comuna (top 8)'}
        >
          <GroupedBarChart data={geoData} series={series} valueFormatter={axisFormatter} />
        </ChartCard>
        <ChartCard title={`Mix de formatos — ${activeLabel}`} subtitle="Composición por marca en cada formato">
          <StackedBarChart data={formatData} series={series} valueFormatter={axisFormatter} />
        </ChartCard>
      </div>
    </div>
  );
}
