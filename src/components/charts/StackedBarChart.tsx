'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_AXIS_TEXT, CHART_GRID } from '@/styles/chartPalette';
import type { ChartSeries } from './TrendChart';

interface StackedBarChartProps {
  data: Array<Record<string, number | string>>;
  series: ChartSeries[];
  valueFormatter: (value: number) => string;
}

export default function StackedBarChart({ data, series, valueFormatter }: StackedBarChartProps) {
  return (
    <div className="h-72 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 8 }} barCategoryGap="30%">
          <CartesianGrid stroke={CHART_GRID} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART_AXIS_TEXT, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: CHART_GRID }}
            interval={0}
          />
          <YAxis
            tick={{ fill: CHART_AXIS_TEXT, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => valueFormatter(Number(value))}
            width={70}
          />
          <Tooltip formatter={(value) => valueFormatter(Number(value))} cursor={{ fill: 'rgba(0,0,0,0.03)' }} />
          {series.map((serie) => (
            <Bar
              key={serie.key}
              dataKey={serie.key}
              name={serie.name}
              stackId="stack"
              fill={serie.color}
              stroke="#ffffff"
              strokeWidth={1}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
