'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import type { ComparisonFilters } from '@/core/application/ports/ComparisonReviewRepository';
import type { ReportCatalogs } from '@/core/application/ports/ReportCatalogsRepository';
import type { ComparisonEntityKind } from '@/core/domain/constants/comparison';
import { MAX_ENTITIES_PER_COMPARISON } from '@/core/application/usecases/GetComparisonReview';
import { Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { ComparisonReportConfig } from './config';
import { serializeYearMonth, toComparisonQueryString } from './searchParams';
import CatalogSelect from './CatalogSelect';
import LevelSwitch from './LevelSwitch';
import EntityPicker, { type EntityListItem } from './EntityPicker';

export interface EntityPickerGroup {
  title: string;
  subtitle?: string;
  items: EntityListItem[];
  emptyMessage: string;
  /** sus ids seleccionados viajan al param 'own' (solo dimensiones con supportsOwn) */
  isOwnGroup?: boolean;
  starAction?: (formData: FormData) => Promise<void>;
  starLabel?: string;
}

interface ComparisonFiltersPanelProps {
  config: ComparisonReportConfig;
  catalogs: ReportCatalogs;
  /** grupos de picker visibles por nivel activo */
  groupsByLevel: Partial<Record<ComparisonEntityKind, EntityPickerGroup[]>>;
  initialFilters: ComparisonFilters | null;
  defaultFrom: string; // YYYY-MM
  defaultTo: string;
}

function toIdOrUndefined(value: string): number | undefined {
  return value ? Number(value) : undefined;
}

function parseYm(value: string): { year: number; month: number } | null {
  const match = value.match(/^(\d{4})-(\d{2})$/);
  if (!match) return null;
  return { year: Number(match[1]), month: Number(match[2]) };
}

function initSelection(groups: EntityPickerGroup[], filters: ComparisonFilters | null): number[][] {
  if (!filters) return groups.map(() => []);
  return groups.map((group) => {
    const groupIds = new Set(group.items.map((it) => it.id));
    return filters.entityIds.filter(
      (id) => groupIds.has(id) && filters.ownEntityIds.includes(id) === !!group.isOwnGroup,
    );
  });
}

export default function ComparisonFiltersPanel({
  config,
  catalogs,
  groupsByLevel,
  initialFilters,
  defaultFrom,
  defaultTo,
}: ComparisonFiltersPanelProps) {
  const router = useRouter();
  const pathname = usePathname();

  const [level, setLevel] = useState<ComparisonEntityKind>(initialFilters?.kind ?? config.levels[0].kind);
  const groups = useMemo(() => groupsByLevel[level] ?? [], [groupsByLevel, level]);
  const [selectedByGroup, setSelectedByGroup] = useState<number[][]>(() => initSelection(groups, initialFilters));

  const [from, setFrom] = useState(initialFilters ? serializeYearMonth(initialFilters.from) : defaultFrom);
  const [to, setTo] = useState(initialFilters ? serializeYearMonth(initialFilters.to) : defaultTo);
  const [regionId, setRegionId] = useState(initialFilters?.regionId ? String(initialFilters.regionId) : '');
  const [typeId, setTypeId] = useState(initialFilters?.typeId ? String(initialFilters.typeId) : '');
  const [providerId, setProviderId] = useState(initialFilters?.providerId ? String(initialFilters.providerId) : '');
  const [categoryId, setCategoryId] = useState(initialFilters?.categoryId ? String(initialFilters.categoryId) : '');

  const totalSelected = selectedByGroup.reduce((sum, ids) => sum + ids.length, 0);
  const selectionFull = totalSelected >= MAX_ENTITIES_PER_COMPARISON;
  const periodValid = !!from && !!to && from <= to;
  const canGenerate = totalSelected >= 1 && periodValid;
  const hidden = config.hiddenFilters;

  // Cambiar de nivel limpia la selección: nunca se mezclan entidades de niveles distintos
  function handleLevelChange(newLevel: ComparisonEntityKind) {
    setLevel(newLevel);
    setSelectedByGroup((groupsByLevel[newLevel] ?? []).map(() => []));
  }

  function toggle(groupIndex: number, id: number) {
    setSelectedByGroup((prev) =>
      prev.map((ids, i) => (i === groupIndex ? (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]) : ids)),
    );
  }

  function handleGenerate() {
    const fromYm = parseYm(from);
    const toYm = parseYm(to);
    if (!fromYm || !toYm) return;
    const ownEntityIds = groups.flatMap((g, i) => (g.isOwnGroup ? selectedByGroup[i] : []));
    const filters: ComparisonFilters = {
      kind: level,
      entityIds: selectedByGroup.flat(),
      ownEntityIds,
      from: fromYm,
      to: toYm,
      regionId: hidden.includes('regionId') ? undefined : toIdOrUndefined(regionId),
      typeId: hidden.includes('typeId') ? undefined : toIdOrUndefined(typeId),
      providerId: hidden.includes('providerId') ? undefined : toIdOrUndefined(providerId),
      categoryId: hidden.includes('categoryId') ? undefined : toIdOrUndefined(categoryId),
    };
    router.push(`${pathname}?${toComparisonQueryString(config, filters)}`);
  }

  return (
    <div className="space-y-4 print-hidden">
      {config.levels.length > 1 && (
        <LevelSwitch levels={config.levels} active={level} onChange={handleLevelChange} />
      )}

      <div className={cn('grid gap-4', groups.length > 1 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1')}>
        {groups.map((group, i) => (
          <EntityPicker
            key={group.title}
            title={group.title}
            subtitle={group.subtitle}
            items={group.items}
            selectedIds={selectedByGroup[i] ?? []}
            onToggle={(id) => toggle(i, id)}
            selectionFull={selectionFull}
            emptyMessage={group.emptyMessage}
            searchPlaceholder={config.pickerPlaceholder}
            starAction={group.starAction}
            starLabel={group.starLabel}
          />
        ))}
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
          {!hidden.includes('regionId') && (
            <CatalogSelect label="Región" items={catalogs.regions} value={regionId} onChange={setRegionId} />
          )}
          {!hidden.includes('typeId') && (
            <CatalogSelect label="Formato" items={catalogs.types} value={typeId} onChange={setTypeId} />
          )}
          {!hidden.includes('providerId') && (
            <CatalogSelect label="Proveedor" items={catalogs.providers} value={providerId} onChange={setProviderId} />
          )}
          {!hidden.includes('categoryId') && (
            <CatalogSelect label="Categoría" items={catalogs.categories} value={categoryId} onChange={setCategoryId} />
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-4 flex-wrap">
          <p className="text-sm text-neutral-600">
            {totalSelected === 0
              ? `Selecciona hasta ${MAX_ENTITIES_PER_COMPARISON} ${config.entityLabels.plural} para comparar.`
              : `Seleccionaste ${totalSelected} de ${MAX_ENTITIES_PER_COMPARISON} ${config.entityLabels.plural}${!periodValid ? ' — revisa el período' : ''}.`}
          </p>
          <Button onClick={handleGenerate} disabled={!canGenerate} size="sm">
            Generar reporte
          </Button>
        </div>
      </div>
    </div>
  );
}
