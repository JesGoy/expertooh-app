'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CHART_AXIS_TEXT, CHART_GRID } from '@/styles/chartPalette';

export interface ChartSeries {
  key: string;
  name: string;
  color: string;
}

interface TrendChartProps {
  /** Filas { label, [serieKey]: number } — meses sin datos ya rellenados con 0 */
  data: Array<Record<string, number | string>>;
  series: ChartSeries[];
  valueFormatter: (value: number) => string;
}

export default function TrendChart({ data, series, valueFormatter }: TrendChartProps) {
  return (
    <div className="h-72 min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: 8 }}>
          <CartesianGrid stroke={CHART_GRID} vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: CHART_AXIS_TEXT, fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: CHART_GRID }}
            minTickGap={24}
          />
          <YAxis
            tick={{ fill: CHART_AXIS_TEXT, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => valueFormatter(Number(value))}
            width={70}
          />
          <Tooltip formatter={(value) => valueFormatter(Number(value))} />
          {series.map((serie) => (
            <Line
              key={serie.key}
              type="monotone"
              dataKey={serie.key}
              name={serie.name}
              stroke={serie.color}
              strokeWidth={2}
              dot={{ r: 3, fill: serie.color, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
