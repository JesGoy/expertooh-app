'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CHART_AXIS_TEXT } from '@/styles/chartPalette';

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

interface SovDonutProps {
  data: DonutSlice[];
  centerLabel?: string;
  valueFormatter: (value: number) => string;
}

interface PieLabelProps {
  percent?: number;
  x?: number;
  y?: number;
  textAnchor?: 'start' | 'middle' | 'end' | 'inherit';
}

const MIN_PERCENT_FOR_LABEL = 0.04;

function renderPercentLabel({ percent = 0, x = 0, y = 0, textAnchor }: PieLabelProps) {
  if (percent < MIN_PERCENT_FOR_LABEL) return null;
  return (
    <text x={x} y={y} textAnchor={textAnchor} fill={CHART_AXIS_TEXT} fontSize={12}>
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
}

export default function SovDonut({ data, centerLabel, valueFormatter }: SovDonutProps) {
  const visible = data.filter((d) => d.value > 0);

  return (
    <div className="relative h-72 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={visible}
            dataKey="value"
            nameKey="name"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={1}
            label={renderPercentLabel}
            labelLine={false}
            isAnimationActive={false}
          >
            {visible.map((slice) => (
              <Cell key={slice.name} fill={slice.color} stroke="#ffffff" strokeWidth={1} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => valueFormatter(Number(value))} />
        </PieChart>
      </ResponsiveContainer>
      {centerLabel && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-xs text-neutral-500 text-center max-w-[40%]">{centerLabel}</span>
        </div>
      )}
    </div>
  );
}
