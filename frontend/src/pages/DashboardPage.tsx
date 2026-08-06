import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useLogs } from '../hooks/useLogs.js';
import { useLogSocket } from '../hooks/useLogSocket.js';
import { logsApi } from '../services/logs.api.js';
import { Button } from '../components/ui/Button.js';
import { Skeleton } from '../components/ui/Skeleton.js';
import { TrendChart } from '../components/charts/TrendChart.js';
import { MetricSelector } from '../components/charts/MetricSelector.js';
import { RangeToggle } from '../components/charts/RangeToggle.js';
import { DailyLogModal } from '../components/daily-log/DailyLogModal.js';
import type { DailyLog } from '../types/daily-log.js';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const [range, setRange] = useState<'week' | 'month'>('week');
  const { logs, loading, error, refetch, mergeLog } = useLogs(range);
  const [metrics, setMetrics] = useState<string[]>(['mood', 'anxiety', 'sleepHours']);
  const [modalOpen, setModalOpen] = useState(false);
  const [todayLog, setTodayLog] = useState<DailyLog | null | undefined>(undefined);

  useLogSocket(mergeLog);

  useEffect(() => {
    logsApi.today().then(setTodayLog).catch(() => setTodayLog(null));
  }, [logs]);

  const firstName = user?.name?.split(' ')[0] ?? '';

  return (
    <div className="min-h-screen bg-calm-50 pb-16">
      <header className="border-b border-calm-100 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl" aria-hidden="true">
              🌿
            </span>
            <span className="font-bold text-dusk-700">Progress Tracker</span>
          </div>
          <div className="flex items-center gap-3">
            {user?.avatarUrl && (
              <img src={user.avatarUrl} alt="" className="h-8 w-8 rounded-full" referrerPolicy="no-referrer" />
            )}
            <Button variant="ghost" onClick={() => logout()} className="!px-3 !py-1.5 text-sm">
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <section className="animate-fade-in rounded-xl2 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-bold text-dusk-700">
            {firstName ? `Hola, ${firstName}` : 'Hola'} 👋
          </h1>
          <p className="mt-1 text-sm text-dusk-400">
            {todayLog === undefined
              ? 'Revisando tu día…'
              : todayLog
                ? 'Ya registraste cómo te sientes hoy. Puedes ajustarlo si algo cambió.'
                : '¿Cómo te sientes hoy? Tómate un minuto para registrarlo.'}
          </p>
          <Button className="mt-4" onClick={() => setModalOpen(true)}>
            {todayLog ? 'Ajustar registro de hoy' : 'Registrar mi día'}
          </Button>
        </section>

        <section className="animate-fade-in rounded-xl2 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-bold text-dusk-700">Tus tendencias</h2>
            <RangeToggle value={range} onChange={setRange} />
          </div>
          <MetricSelector selected={metrics} onChange={setMetrics} />
          <div className="mt-4">
            {loading ? (
              <Skeleton className="h-72 w-full" />
            ) : error ? (
              <p className="py-8 text-center text-sm text-dusk-400">{error}</p>
            ) : (
              <TrendChart logs={logs} metricKeys={metrics} />
            )}
          </div>
        </section>
      </main>

      <DailyLogModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          refetch();
        }}
        initialLog={todayLog}
      />
    </div>
  );
}
