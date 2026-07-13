'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { BrandListItem } from '@/core/application/ports/AgencyBrandRepository';
import type { BrandReviewFilters } from '@/core/application/ports/BrandReviewRepository';
import type { ReportCatalogs, CatalogItem } from '@/core/application/ports/ReportCatalogsRepository';
import { MAX_BRANDS_PER_REVIEW } from '@/core/application/usecases/GetBrandReview';
import { Button } from '@/components/ui';
import { serializeYearMonth, toBrandReviewQueryString } from './searchParams';
import { assignBrandAction, unassignBrandAction } from './actions';
import BrandPicker from './BrandPicker';

interface FiltersPanelProps {
  catalogs: ReportCatalogs;
  myBrands: BrandListItem[];
  otherBrands: BrandListItem[];
  isAgency: boolean;
  initialFilters: BrandReviewFilters | null;
  defaultFrom: string; // YYYY-MM
  defaultTo: string;
}

function CatalogSelect({
  label,
  items,
  value,
  onChange,
}: {
  label: string;
  items: CatalogItem[];
  value: string;
  onChange: (v: string) => void;
}) {
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

function toIdOrUndefined(value: string): number | undefined {
  return value ? Number(value) : undefined;
}

function parseYm(value: string): { year: number; month: number } | null {
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) };
}

export default function FiltersPanel({
  catalogs,
  myBrands,
  otherBrands,
  isAgency,
  initialFilters,
  defaultFrom,
  defaultTo,
}: FiltersPanelProps) {
  const router = useRouter();
  const pathname = usePathname();

  const myIds = useMemo(() => new Set(myBrands.map((b) => b.id)), [myBrands]);
  const [selectedOwn, setSelectedOwn] = useState<number[]>(
    initialFilters?.brandIds.filter((id) => myIds.has(id)) ?? [],
  );
  const [selectedOthers, setSelectedOthers] = useState<number[]>(
    initialFilters?.brandIds.filter((id) => !myIds.has(id)) ?? [],
  );
  const [from, setFrom] = useState(initialFilters ? serializeYearMonth(initialFilters.from) : defaultFrom);
  const [to, setTo] = useState(initialFilters ? serializeYearMonth(initialFilters.to) : defaultTo);
  const [regionId, setRegionId] = useState(initialFilters?.regionId ? String(initialFilters.regionId) : '');
  const [typeId, setTypeId] = useState(initialFilters?.typeId ? String(initialFilters.typeId) : '');
  const [providerId, setProviderId] = useState(initialFilters?.providerId ? String(initialFilters.providerId) : '');
  const [categoryId, setCategoryId] = useState(initialFilters?.categoryId ? String(initialFilters.categoryId) : '');

  const totalSelected = selectedOwn.length + selectedOthers.length;
  const selectionFull = totalSelected >= MAX_BRANDS_PER_REVIEW;
  const periodValid = !!from && !!to && from <= to;
  const canGenerate = totalSelected >= 1 && periodValid;

  const toggle = (list: number[], setList: (v: number[]) => void) => (id: number) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  function handleGenerate() {
    const fromYm = parseYm(from);
    const toYm = parseYm(to);
    if (!fromYm || !toYm) return;
    const qs = toBrandReviewQueryString({
      brandIds: [...selectedOwn, ...selectedOthers],
      ownBrandIds: selectedOwn,
      from: fromYm,
      to: toYm,
      regionId: toIdOrUndefined(regionId),
      typeId: toIdOrUndefined(typeId),
      providerId: toIdOrUndefined(providerId),
      categoryId: toIdOrUndefined(categoryId),
    });
    router.push(`${pathname}?${qs}`);
  }

  return (
    <div className="space-y-4 print-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <BrandPicker
          title="Mis marcas"
          subtitle={isAgency ? 'Marcas asignadas a tu agencia' : 'Solo disponible para perfil agencia'}
          brands={myBrands}
          selectedIds={selectedOwn}
          onToggle={toggle(selectedOwn, setSelectedOwn)}
          selectionFull={selectionFull}
          emptyMessage={isAgency ? 'Aún no tienes marcas asignadas. Fija marcas desde la lista de la derecha.' : 'Selecciona marcas desde la lista de la derecha.'}
          starAction={isAgency ? unassignBrandAction : undefined}
          starLabel={isAgency ? 'Quitar' : undefined}
        />
        <BrandPicker
          title="Marcas competidoras"
          subtitle="Todas las marcas monitoreadas"
          brands={otherBrands}
          selectedIds={selectedOthers}
          onToggle={toggle(selectedOthers, setSelectedOthers)}
          selectionFull={selectionFull}
          emptyMessage="Sin marcas disponibles."
          starAction={isAgency ? assignBrandAction : undefined}
          starLabel={isAgency ? 'Fijar como mía' : undefined}
        />
      </div>

      <div className="rounded-2xl border border-neutral-200/60 bg-white p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <label className="flex flex-col gap-1 text-xs text-neutral-600">
            Desde
            <input
              type="month"
              value={from}
              max={to || undefined}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:bg-white transition-colors"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-600">
            Hasta
            <input
              type="month"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-ink outline-none focus:border-brand focus:bg-white transition-colors"
            />
          </label>
          <CatalogSelect label="Región" items={catalogs.regions} value={regionId} onChange={setRegionId} />
          <CatalogSelect label="Formato" items={catalogs.types} value={typeId} onChange={setTypeId} />
          <CatalogSelect label="Proveedor" items={catalogs.providers} value={providerId} onChange={setProviderId} />
          <CatalogSelect label="Categoría" items={catalogs.categories} value={categoryId} onChange={setCategoryId} />
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-neutral-600">
            {totalSelected === 0
              ? `Selecciona hasta ${MAX_BRANDS_PER_REVIEW} marcas para comparar.`
              : `${totalSelected} de ${MAX_BRANDS_PER_REVIEW} marcas seleccionadas${!periodValid ? ' — revisa el período' : ''}.`}
          </p>
          <Button onClick={handleGenerate} disabled={!canGenerate} size="sm">
            Generar reporte
          </Button>
        </div>
      </div>
    </div>
  );
}
