'use client';

import { useMemo, useState } from 'react';
import type { EntityMonthRow, YearMonth } from '@/core/application/ports/ComparisonReviewRepository';
import type { ComparisonBreakdownResult, ShareMetric } from '@/core/application/usecases/GetComparisonReview';
import ChartCard from '@/components/reports/ChartCard';
import SovDonut from '@/components/charts/SovDonut';
import TrendChart from '@/components/charts/TrendChart';
import GroupedBarChart from '@/components/charts/GroupedBarChart';
import StackedBarChart from '@/components/charts/StackedBarChart';
import { cn } from '@/lib/utils';
import { BREAKDOWN_LABELS, METRIC_AXIS_FORMATTERS, METRIC_OPTIONS, METRIC_TOOLTIP_FORMATTERS } from './labels';
import { type EntityMeta, toBreakdownData, toChartSeries, toDonutData, toTrendData } from './transforms';

const MAX_GROUPED_BARS = 8;

interface ComparisonChartsProps {
  entities: Array<EntityMeta & { metrics: Record<ShareMetric, number> }>;
  monthly: EntityMonthRow[];
  breakdowns: [ComparisonBreakdownResult, ComparisonBreakdownResult];
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

export default function ComparisonCharts({
  entities,
  monthly,
  breakdowns,
  from,
  to,
  hasAudience,
}: ComparisonChartsProps) {
  const [metric, setMetric] = useState<ShareMetric>('faces');

  const activeLabel = METRIC_OPTIONS.find((m) => m.key === metric)?.label ?? '';
  const tooltipFormatter = METRIC_TOOLTIP_FORMATTERS[metric];
  const axisFormatter = METRIC_AXIS_FORMATTERS[metric];
  const series = useMemo(() => toChartSeries(entities), [entities]);

  const donutData = useMemo(
    () => toDonutData(entities.map((e) => ({ ...e, value: e.metrics[metric] }))),
    [entities, metric],
  );
  const trendData = useMemo(() => toTrendData(monthly, entities, metric, from, to), [monthly, entities, metric, from, to]);
  const [grouped, stacked] = breakdowns;
  const groupedData = useMemo(
    () => toBreakdownData(grouped.rows, entities, metric, MAX_GROUPED_BARS),
    [grouped.rows, entities, metric],
  );
  const stackedData = useMemo(
    () => toBreakdownData(stacked.rows, entities, metric),
    [stacked.rows, entities, metric],
  );
  const groupedLabel = BREAKDOWN_LABELS[grouped.kind];
  const stackedLabel = BREAKDOWN_LABELS[stacked.kind];

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
        <ChartCard title={`${groupedLabel.chartTitle} — ${activeLabel}`} subtitle={groupedLabel.chartSubtitle}>
          <GroupedBarChart data={groupedData} series={series} valueFormatter={axisFormatter} />
        </ChartCard>
        <ChartCard title={`${stackedLabel.chartTitle} — ${activeLabel}`} subtitle={stackedLabel.chartSubtitle}>
          <StackedBarChart data={stackedData} series={series} valueFormatter={axisFormatter} />
        </ChartCard>
      </div>
    </div>
  );
}
