'use client';

import { useMemo, useState } from 'react';
import type { BrandListItem } from '@/core/application/ports/AgencyBrandRepository';
import { cn } from '@/lib/utils';

interface BrandPickerProps {
  title: string;
  subtitle?: string;
  brands: BrandListItem[];
  selectedIds: number[];
  onToggle: (id: number) => void;
  /** true cuando el set alcanzó el máximo: bloquea agregar (no quitar) */
  selectionFull: boolean;
  emptyMessage: string;
  /** Acción de gestión por fila (asignar/quitar de "mis marcas"), solo agencia */
  starAction?: (formData: FormData) => Promise<void>;
  starLabel?: string;
}

const VISIBLE_LIMIT = 60;

export default function BrandPicker({
  title,
  subtitle,
  brands,
  selectedIds,
  onToggle,
  selectionFull,
  emptyMessage,
  starAction,
  starLabel,
}: BrandPickerProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return brands;
    return brands.filter(
      (b) => b.name.toLowerCase().includes(term) || b.categoryName?.toLowerCase().includes(term),
    );
  }, [brands, search]);

  const visible = filtered.slice(0, VISIBLE_LIMIT);

  return (
    <section className="rounded-2xl border border-neutral-200/60 bg-white p-4 flex flex-col">
      <div className="mb-3">
        <h3 className="text-sm font-medium text-ink">{title}</h3>
        {subtitle && <p className="text-xs text-neutral-500 mt-0.5">{subtitle}</p>}
      </div>

      <input
        type="search"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Buscar marca o categoría…"
        className="mb-3 w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm outline-none focus:border-brand focus:bg-white transition-colors"
      />

      {brands.length === 0 && <p className="text-sm text-neutral-500">{emptyMessage}</p>}

      <ul className="space-y-1 overflow-y-auto max-h-64 pr-1 thin-scroll">
        {visible.map((brand) => {
          const checked = selectedIds.includes(brand.id);
          const disabled = !checked && selectionFull;
          return (
            <li key={brand.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onToggle(brand.id)}
                disabled={disabled}
                className={cn(
                  'flex-1 flex items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm transition-colors',
                  checked ? 'bg-brand/5 text-ink' : 'hover:bg-neutral-50 text-neutral-700',
                  disabled && 'opacity-40 cursor-not-allowed',
                )}
              >
                <span
                  className={cn(
                    'w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center',
                    checked ? 'bg-brand border-brand' : 'border-neutral-300',
                  )}
                >
                  {checked && (
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 12 12" fill="none">
                      <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </span>
                <span className="truncate">{brand.name}</span>
                {brand.categoryName && (
                  <span className="ml-auto text-xs text-neutral-400 truncate max-w-[40%]">{brand.categoryName}</span>
                )}
              </button>
              {starAction && (
                <form action={starAction}>
                  <input type="hidden" name="brandId" value={brand.id} />
                  <button
                    type="submit"
                    title={starLabel}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-brand hover:bg-brand/5 transition-colors text-xs"
                  >
                    {starLabel}
                  </button>
                </form>
              )}
            </li>
          );
        })}
      </ul>

      {filtered.length > VISIBLE_LIMIT && (
        <p className="mt-2 text-xs text-neutral-400">
          Mostrando {VISIBLE_LIMIT} de {filtered.length} — refina la búsqueda para ver más.
        </p>
      )}
    </section>
  );
}
