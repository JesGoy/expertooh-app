/** Formateadores compartidos (es-CL) para reportes y tablas */

const clpFormatter = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 });

const compactFormatter = new Intl.NumberFormat('es-CL', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

export function formatCLP(value: number): string {
  return Number.isFinite(value) ? clpFormatter.format(value) : '—';
}

export function formatNumber(value: number): string {
  return Number.isFinite(value) ? numberFormatter.format(value) : '—';
}

export function formatCompact(value: number): string {
  return Number.isFinite(value) ? compactFormatter.format(value) : '—';
}

export function formatPercent(share: number, decimals = 1): string {
  return Number.isFinite(share) ? `${(share * 100).toFixed(decimals)}%` : '—';
}

export const MONTH_LABELS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
] as const;

/** "Ene 2021" para un año/mes 1-12 */
export function formatYearMonth(year: number, month: number): string {
  const label = MONTH_LABELS[month - 1] ?? String(month);
  return `${label} ${year}`;
}

export function formatDate(date: Date | null): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('es-CL');
}
