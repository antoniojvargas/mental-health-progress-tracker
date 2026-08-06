import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { DailyLog } from '../../types/daily-log.js';
import { getMetric } from './metrics.js';

interface TrendChartProps {
  logs: DailyLog[];
  metricKeys: string[];
}

interface ChartPoint {
  logDate: string;
  [metricKey: string]: number | string;
}

export function TrendChart({ logs, metricKeys }: TrendChartProps) {
  if (logs.length === 0) {
    return (
      <div className="flex h-72 flex-col items-center justify-center rounded-xl2 bg-calm-50 text-center">
        <p className="text-3xl">🌱</p>
        <p className="mt-2 font-medium text-dusk-500">Aún no hay datos</p>
        <p className="text-sm text-dusk-300">Tu primer registro empieza la historia.</p>
      </div>
    );
  }

  const metrics = metricKeys.map(getMetric);
  const scaleMetrics = metrics.filter((m) => m.axis === 'scale');
  const hoursMetrics = metrics.filter((m) => m.axis === 'hours');

  const data: ChartPoint[] = logs.map((log) => {
    const point: ChartPoint = { logDate: log.logDate };
    for (const metric of metrics) {
      point[metric.key] = metric.format(log);
    }
    return point;
  });

  return (
    <ResponsiveContainer width="100%" height={288}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#eee9de" />
        <XAxis
          dataKey="logDate"
          tickFormatter={(value: string) => format(parseISO(value), 'd MMM', { locale: es })}
          tick={{ fontSize: 12, fill: '#a8926f' }}
          axisLine={{ stroke: '#eee9de' }}
          tickLine={false}
        />
        {scaleMetrics.length > 0 && (
          <YAxis
            yAxisId="scale"
            width={28}
            tick={{ fontSize: 12, fill: '#a8926f' }}
            axisLine={false}
            tickLine={false}
          />
        )}
        {hoursMetrics.length > 0 && (
          <YAxis
            yAxisId="hours"
            orientation="right"
            width={28}
            tick={{ fontSize: 12, fill: '#a8926f' }}
            axisLine={false}
            tickLine={false}
          />
        )}
        <Tooltip content={<ChartTooltip metrics={metrics} />} />
        {metrics.map((metric) => (
          <Line
            key={metric.key}
            yAxisId={metric.axis === 'hours' ? 'hours' : 'scale'}
            type="monotone"
            dataKey={metric.key}
            name={metric.label}
            stroke={metric.color}
            strokeWidth={2.5}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
            connectNulls
            animationDuration={300}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

interface ChartTooltipProps {
  active?: boolean;
  label?: string;
  payload?: { dataKey: string; value: number }[];
  metrics: ReturnType<typeof getMetric>[];
}

function ChartTooltip({ active, label, payload, metrics }: ChartTooltipProps) {
  if (!active || !payload || !label) return null;

  return (
    <div className="rounded-lg bg-dusk-700 px-3 py-2 text-xs text-white shadow-lg">
      <p className="mb-1 font-semibold">{format(parseISO(label), "d 'de' MMMM", { locale: es })}</p>
      {payload.map((entry) => {
        const metric = metrics.find((m) => m.key === entry.dataKey);
        if (!metric) return null;
        return (
          <p key={entry.dataKey} className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: metric.color }} />
            {metric.label}: {metric.describe(entry.value)}
          </p>
        );
      })}
    </div>
  );
}
