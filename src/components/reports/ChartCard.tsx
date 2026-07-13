import type { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}

export default function ChartCard({ title, subtitle, actions, children }: ChartCardProps) {
  return (
    <section className="rounded-2xl border border-neutral-200/60 bg-white/70 backdrop-blur p-4 print-avoid-break">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="text-sm font-medium text-ink">{title}</h3>
          {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}
