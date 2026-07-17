'use client';

import type { CatalogItem } from '@/core/application/ports/ReportCatalogsRepository';

interface CatalogSelectProps {
  label: string;
  items: CatalogItem[];
  value: string;
  onChange: (v: string) => void;
}

export default function CatalogSelect({ label, items, value, onChange }: CatalogSelectProps) {
  return (
    <label className="flex flex-col gap-1 text-xs text-neutral-600">
      {label}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:bg-white transition-colors"
      >
        <option value="">Todos</option>
        {items.map((item) => (
          <option key={item.id} value={item.id}>
            {item.name}
          </option>
        ))}
      </select>
    </label>
  );
}
