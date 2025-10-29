'use client';
import { useState, useMemo } from 'react';

type BrandInfo = { id: number; name: string; categoryName?: string };

interface Props {
  mine: BrandInfo[];
  others: BrandInfo[];
  initialFrom: string;
  initialTo: string;
}

export default function BrandReviewClient({ mine, others, initialFrom, initialTo }: Props) {
  const [selectedMine, setSelectedMine] = useState<number[]>([]);
  const [selectedOthers, setSelectedOthers] = useState<number[]>([]);
  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [touched, setTouched] = useState(false);

  const allMineChecked = selectedMine.length === mine.length && mine.length > 0;
  const allOthersChecked = selectedOthers.length === others.length && others.length > 0;

  const dateValid = useMemo(() => {
    if (!from || !to) return false;
    return from <= to;
  }, [from, to]);

  const showDateError = touched && !dateValid;

  const compareDisabled =
    selectedMine.length === 0 ||
    selectedOthers.length === 0 ||
    !dateValid;

  const summary = useMemo(() => {
    if (compareDisabled) return 'Selecciona marcas y un rango válido.';
    return `Comparando ${selectedMine.length} propia(s) vs ${selectedOthers.length} externa(s) del ${from} al ${to}.`;
  }, [compareDisabled, selectedMine.length, selectedOthers.length, from, to]);

  const toggle = (id: number, group: 'mine' | 'others') => {
    const setter = group === 'mine' ? setSelectedMine : setSelectedOthers;
    setter(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };
  const toggleAll = (group: 'mine' | 'others') => {
    if (group === 'mine') {
      setSelectedMine(allMineChecked ? [] : mine.map(b => b.id));
    } else {
      setSelectedOthers(allOthersChecked ? [] : others.map(b => b.id));
    }
  };

  function handleCompare() {
    // Placeholder para futura navegación / cálculo
    alert(
      `Comparar\nMine: ${selectedMine.join(', ')}\nOthers: ${selectedOthers.join(', ')}\nRango: ${from} -> ${to}`
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded border bg-white p-4 flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-neutral-600">Desde</label>
              <input
                type="date"
                value={from}
                onChange={e => { setFrom(e.target.value); setTouched(true); }}
                className="border rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand/40"
                max={to || undefined}
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-neutral-600">Hasta</label>
              <input
                type="date"
                value={to}
                onChange={e => { setTo(e.target.value); setTouched(true); }}
                className="border rounded px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-brand/40"
                min={from || undefined}
              />
            </div>
          <button
            disabled={compareDisabled}
            onClick={handleCompare}
            className={`px-4 py-2 rounded text-sm font-medium transition ${
              compareDisabled
                ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                : 'bg-brand text-white hover:opacity-90'
            }`}
          >
            Comparar
          </button>
          <p className="text-sm text-neutral-700">{summary}</p>
        </div>
        {showDateError && (
          <p className="text-xs text-red-600">
            Rango inválido: la fecha inicial debe ser menor o igual a la final.
          </p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <BrandList
          title={`Mis Marcas (${mine.length})`}
          brands={mine}
          selected={selectedMine}
          onToggle={id => toggle(id, 'mine')}
          onToggleAll={() => toggleAll('mine')}
          allChecked={allMineChecked}
          accent="brand"
          emptyMsg="Sin marcas asociadas."
        />
        <BrandList
          title={`Otras Marcas (${others.length})`}
          brands={others}
          selected={selectedOthers}
          onToggle={id => toggle(id, 'others')}
          onToggleAll={() => toggleAll('others')}
          allChecked={allOthersChecked}
          accent="neutral"
          emptyMsg="Sin otras marcas."
        />
      </div>
    </div>
  );
}

interface BrandListProps {
  title: string;
  brands: BrandInfo[];
  selected: number[];
  onToggle: (id: number) => void;
  onToggleAll: () => void;
  allChecked: boolean;
  accent: 'brand' | 'neutral';
  emptyMsg: string;
}

function BrandList({
  title,
  brands,
  selected,
  onToggle,
  onToggleAll,
  allChecked,
  accent,
  emptyMsg,
}: BrandListProps) {
  return (
    <section className="border rounded bg-white p-4 flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-ink">{title}</h2>
        <label className="flex items-center gap-1 cursor-pointer text-xs select-none">
          <input
            type="checkbox"
            className="accent-brand"
            checked={allChecked}
            onChange={onToggleAll}
            aria-label="Seleccionar todo"
          />
          Todo
        </label>
      </div>
      {brands.length === 0 && (
        <p className="text-xs text-neutral-500">{emptyMsg}</p>
      )}
      <ul className="divide-y overflow-auto max-h-[520px] pr-1 thin-scroll">
        {brands.map(b => {
          const checked = selected.includes(b.id);
          return (
            <li key={b.id} className="flex items-center justify-between py-2 gap-3">
              <label className="flex items-center gap-3 cursor-pointer flex-1 min-w-0">
                <input
                  type="checkbox"
                  className="accent-brand shrink-0"
                  checked={checked}
                  onChange={() => onToggle(b.id)}
                />
                <span className="flex flex-col min-w-0">
                  <span className={`text-sm font-medium truncate ${checked ? 'text-ink' : 'text-neutral-800'}`}>
                    {b.name}
                  </span>
                  {b.categoryName && (
                    <span className="text-[10px] uppercase tracking-wide text-neutral-500 truncate">
                      {b.categoryName}
                    </span>
                  )}
                </span>
              </label>
              {checked && (
                <span
                  className={`text-[10px] px-2 py-1 rounded-full font-semibold ${
                    accent === 'brand'
                      ? 'bg-brand/10 text-brand'
                      : 'bg-neutral-200 text-neutral-700'
                  }`}
                >
                  OK
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}