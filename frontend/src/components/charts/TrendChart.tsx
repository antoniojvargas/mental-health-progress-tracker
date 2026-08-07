import { useMemo, type SVGProps } from 'react';
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
  const metrics = metricKeys.map(getMetric);
  const scaleMetrics = metrics.filter((m) => m.axis === 'scale');
  const hoursMetrics = metrics.filter((m) => m.axis === 'hours');
  // `metricKeys` is a fresh array reference every render even with the same content — this
  // gives useMemo a stable primitive to depend on instead, so a named variable satisfies the
  // "simple expression" deps requirement without recomputing on unrelated re-renders.
  const metricKeysSignature = metricKeys.join(',');

  // Recomputed only when the underlying logs or the chosen metrics actually change, not on
  // every render of the dashboard around it (e.g. opening the daily-log modal). Must run
  // before the empty-state early return below — React hooks can't be called conditionally.
  const data = useMemo<ChartPoint[]>(() => {
    return logs.map((log) => {
      const point: ChartPoint = { logDate: log.logDate };
      for (const metric of metrics) {
        point[metric.key] = metric.format(log);
      }
      return point;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, metricKeysSignature]);

  if (logs.length === 0) {
    return (
      <div className="flex h-72 flex-col items-center justify-center rounded-xl2 border border-ink-100 bg-paper-50 text-center">
        <SunriseIcon className="h-8 w-8 text-ink-300" aria-hidden="true" />
        <p className="mt-2 font-display font-medium text-ink-600">Aún no hay datos</p>
        <p className="text-sm text-ink-400">Tu primer registro empieza la historia.</p>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={288}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EAE0CB" />
        <XAxis
          dataKey="logDate"
          tickFormatter={(value: string) => format(parseISO(value), 'd MMM', { locale: es })}
          tick={{ fontSize: 12, fill: '#8A9B97', fontFamily: '"IBM Plex Mono", monospace' }}
          axisLine={{ stroke: '#EAE0CB' }}
          tickLine={false}
        />
        {scaleMetrics.length > 0 && (
          <YAxis
            yAxisId="scale"
            width={28}
            tick={{ fontSize: 12, fill: '#8A9B97', fontFamily: '"IBM Plex Mono", monospace' }}
            axisLine={false}
            tickLine={false}
          />
        )}
        {hoursMetrics.length > 0 && (
          <YAxis
            yAxisId="hours"
            orientation="right"
            width={28}
            tick={{ fontSize: 12, fill: '#8A9B97', fontFamily: '"IBM Plex Mono", monospace' }}
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
    <div className="rounded-lg bg-ink-700 px-3 py-2 text-xs text-white shadow-lg">
      <p className="mb-1 font-mono font-medium">{format(parseISO(label), "d 'de' MMMM", { locale: es })}</p>
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

function SunriseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      {...props}
    >
      <path d="M5 16a7 7 0 0 1 14 0" />
      <path d="M3 16h18M12 3v3M5.6 8.6l1.4 1.4M18.4 8.6 17 10" />
      <path d="M8 20h8" />
    </svg>
  );
}
