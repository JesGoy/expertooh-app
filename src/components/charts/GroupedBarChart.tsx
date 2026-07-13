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

interface GroupedBarChartProps {
  data: Array<Record<string, number | string>>;
  series: ChartSeries[];
  valueFormatter: (value: number) => string;
}

export default function GroupedBarChart({ data, series, valueFormatter }: GroupedBarChartProps) {
  return (
    <div className="h-72 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 8 }} barCategoryGap="25%">
          <CartesianGrid stroke={CHART_GRID} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART_AXIS_TEXT, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: CHART_GRID }}
            interval={0}
            angle={data.length > 6 ? -30 : 0}
            textAnchor={data.length > 6 ? 'end' : 'middle'}
            height={data.length > 6 ? 60 : 30}
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
              fill={serie.color}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
