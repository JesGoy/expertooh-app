'use client';

import type { ComparisonEntityKind } from '@/core/domain/constants/comparison';
import { cn } from '@/lib/utils';
import type { ComparisonLevel } from './config';

interface LevelSwitchProps {
  levels: ComparisonLevel[];
  active: ComparisonEntityKind;
  onChange: (kind: ComparisonEntityKind) => void;
}

/** Segmented control de nivel (p.ej. Región|Comuna). Oculto si solo hay 1 nivel. */
export default function LevelSwitch({ levels, active, onChange }: LevelSwitchProps) {
  if (levels.length < 2) return null;

  return (
    <div className="inline-flex rounded-xl border border-neutral-200 bg-white p-1" role="tablist">
      {levels.map((level) => (
        <button
          key={level.kind}
          type="button"
          role="tab"
          aria-selected={active === level.kind}
          onClick={() => onChange(level.kind)}
          className={cn(
            'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors',
            active === level.kind
              ? 'bg-brand text-white'
              : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50',
          )}
        >
          {level.label}
        </button>
      ))}
    </div>
  );
}
