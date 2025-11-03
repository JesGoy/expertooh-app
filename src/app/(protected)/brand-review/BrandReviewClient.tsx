'use client';
import { useState, useMemo } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import './calendar.css';

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
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white shadow-sm rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-neutral-900">Seleccionar fecha</h2>

        </div>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <label className="block text-sm text-neutral-600 mb-2">Desde</label>
            <div className="bg-[#F9F9F9] rounded-xl p-4">
              <Calendar
                value={from ? new Date(from) : null}
                onChange={(value) => {
                  const date = value as Date;
                  if (date) {
                    setFrom(date.toISOString().split('T')[0]);
                    setTouched(true);
                  }
                }}
                maxDate={to ? new Date(to) : undefined}
                className="!border-0 !p-0"
                tileClassName={({ date, view }) => {
                  if (view === 'month' && date && from === date.toISOString().split('T')[0]) {
                    return 'bg-[#FF6B00] text-white rounded-lg';
                  }
                  return '!text-sm hover:!bg-[#FFF0E6] focus:!bg-[#FFF0E6] rounded-lg';
                }}
                navigationLabel={({ date }) => 
                  date.toLocaleDateString('es', { month: 'long', year: 'numeric' })
                }
              />
            </div>
          </div>
          <div>
            <label className="block text-sm text-neutral-600 mb-2">Hasta</label>
            <div className="bg-[#F9F9F9] rounded-xl p-4">
              <Calendar
                value={to ? new Date(to) : null}
                onChange={(value) => {
                  const date = value as Date;
                  if (date) {
                    setTo(date.toISOString().split('T')[0]);
                    setTouched(true);
                  }
                }}
                minDate={from ? new Date(from) : undefined}
                className="!border-0 !p-0"
                tileClassName={({ date, view }) => {
                  if (view === 'month' && date && to === date.toISOString().split('T')[0]) {
                    return 'bg-[#FF6B00] text-white rounded-lg';
                  }
                  return '!text-sm hover:!bg-[#FFF0E6] focus:!bg-[#FFF0E6] rounded-lg';
                }}
                navigationLabel={({ date }) => 
                  date.toLocaleDateString('es', { month: 'long', year: 'numeric' })
                }
              />
            </div>
          </div>
        </div>

        {showDateError && (
          <p className="text-sm text-red-600 mt-4">
            El rango de fechas seleccionado no es válido
          </p>
        )}

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-neutral-700">{summary}</p>
          <button
            onClick={handleCompare}
            disabled={compareDisabled}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-opacity ${
              compareDisabled
                ? 'bg-neutral-200 text-neutral-500 cursor-not-allowed'
                : 'bg-[#FF6B00] text-white hover:opacity-90'
            }`}
          >
            Comparar
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <BrandList
          title="Mis Marcas"
          brands={mine}
          selected={selectedMine}
          onToggle={id => toggle(id, 'mine')}
          onToggleAll={() => toggleAll('mine')}
          allChecked={allMineChecked}
          accent="brand"
          emptyMsg="Sin marcas asociadas."
        />
        <BrandList
          title="Otras Marcas"
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
    <section className="bg-white rounded-xl p-6 flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-medium text-neutral-900">{title}</h2>
      </div>
      <div className="flex items-center justify-between text-sm text-neutral-500 px-2 mb-4">
        <span>Marcas</span>
      </div>
      {brands.length === 0 && (
        <p className="text-sm text-neutral-500">{emptyMsg}</p>
      )}
      <ul className="space-y-4 overflow-auto max-h-[520px] pr-1">
        {brands.map((b, index) => {
          const checked = selected.includes(b.id);
          const indexStr = String(index + 1).padStart(2, '0');
          return (
            <li key={b.id} className="group flex items-center gap-4">
              <button
                onClick={() => onToggle(b.id)}
                className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-colors ${
                  checked 
                    ? 'bg-emerald-500 text-white' 
                    : 'border-2 border-neutral-200 hover:border-emerald-500'
                }`}
              >
                {checked && (
                  <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                    <path d="M10 3L4.5 8.5L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-medium">
                {indexStr}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-neutral-900 font-medium truncate">
                  {b.name}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}