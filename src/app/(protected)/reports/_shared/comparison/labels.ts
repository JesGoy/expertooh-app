import type { ComparisonBreakdown } from '@/core/domain/constants/comparison';
import type { ShareMetric } from '@/core/application/usecases/GetComparisonReview';
import { formatCLP, formatCompact, formatNumber } from '@/lib/formatters';

export const METRIC_OPTIONS: Array<{ key: ShareMetric; label: string }> = [
  { key: 'faces', label: 'Caras' },
  { key: 'investmentCLP', label: 'Inversión' },
  { key: 'areaM2', label: 'm²' },
  { key: 'audience', label: 'Audiencia' },
];

export const METRIC_TOOLTIP_FORMATTERS: Record<ShareMetric, (v: number) => string> = {
  faces: formatNumber,
  investmentCLP: formatCLP,
  areaM2: (v) => `${formatNumber(v)} m²`,
  audience: formatCompact,
};

export const METRIC_AXIS_FORMATTERS: Record<ShareMetric, (v: number) => string> = {
  faces: formatCompact,
  investmentCLP: formatCompact,
  areaM2: formatCompact,
  audience: formatCompact,
};

interface BreakdownLabel {
  chartTitle: string;
  chartSubtitle: string;
  sheetName: string;
  sheetHeader: string;
}

/** Textos por breakdown secundario — nunca coincide con la dimensión comparada */
export const BREAKDOWN_LABELS: Record<ComparisonBreakdown, BreakdownLabel> = {
  region: {
    chartTitle: 'Distribución geográfica',
    chartSubtitle: 'Por región (top 8)',
    sheetName: 'Geografía',
    sheetHeader: 'Región',
  },
  commune: {
    chartTitle: 'Distribución geográfica',
    chartSubtitle: 'Por comuna (top 8)',
    sheetName: 'Geografía',
    sheetHeader: 'Comuna',
  },
  type: {
    chartTitle: 'Mix de formatos',
    chartSubtitle: 'Composición en cada formato',
    sheetName: 'Formatos',
    sheetHeader: 'Formato',
  },
  category: {
    chartTitle: 'Mix de categorías',
    chartSubtitle: 'Composición en cada categoría',
    sheetName: 'Categorías',
    sheetHeader: 'Categoría',
  },
};
