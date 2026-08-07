import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.js';
import { useLogs } from '../hooks/useLogs.js';
import { useLogSocket } from '../hooks/useLogSocket.js';
import { Button } from '../components/ui/Button.js';
import { Skeleton } from '../components/ui/Skeleton.js';
import { Logo } from '../components/ui/Logo.js';
import { TrendChart } from '../components/charts/TrendChart.js';
import { MetricSelector } from '../components/charts/MetricSelector.js';
import { RangeToggle } from '../components/charts/RangeToggle.js';
import { DailyLogModal } from '../components/daily-log/DailyLogModal.js';

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DashboardPage() {
  const { user, logout } = useAuth();
  const [range, setRange] = useState<'week' | 'month'>('week');
  const { logs, loading, error, refetch, mergeLog } = useLogs(range);
  const [metrics, setMetrics] = useState<string[]>(['mood', 'anxiety', 'sleepHours']);
  const [modalOpen, setModalOpen] = useState(false);

  useLogSocket(mergeLog);

  // Both range windows (week/month) always include today, so the already-loaded `logs`
  // fully answers "did I log today?" — no separate fetch needed, and this stays correct
  // for free as `logs` updates from a save or a live socket event.
  const todayLog = loading ? undefined : (logs.find((l) => l.logDate === todayIso()) ?? null);

  const firstName = user?.name?.split(' ')[0] ?? '';

  return (
    <div className="min-h-screen bg-paper-100 pb-16">
      <header className="border-b border-ink-100 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Logo className="h-8 w-8" />
            <span className="font-display text-sm font-semibold tracking-wide text-ink-700">BITÁCORA</span>
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
        <section className="animate-fade-in rounded-xl2 border border-ink-100 bg-white p-6">
          <h1 className="font-display text-xl font-semibold text-ink-700">
            {firstName ? `Hola, ${firstName}.` : 'Hola.'}
          </h1>
          <p className="mt-1 text-sm text-ink-500">
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

        <section className="animate-fade-in rounded-xl2 border border-ink-100 bg-white p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display font-semibold text-ink-700">Tus tendencias</h2>
            <RangeToggle value={range} onChange={setRange} />
          </div>
          <MetricSelector selected={metrics} onChange={setMetrics} />
          <div className="mt-4 border-l-2 border-ember-300 pl-4">
            {loading ? (
              <Skeleton className="h-72 w-full" />
            ) : error ? (
              <p className="py-8 text-center text-sm text-ink-400">{error}</p>
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
