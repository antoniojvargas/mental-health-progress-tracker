import { useState } from 'react';
import { Modal } from '../ui/Modal.js';
import { Button } from '../ui/Button.js';
import { MoodScale } from './MoodScale.js';
import { SliderField } from './SliderField.js';
import { SymptomPicker } from './SymptomPicker.js';
import { logsApi } from '../../services/logs.api.js';
import { useToast } from '../ui/Toast.js';
import type { ActivityType, CreateDailyLogInput, SleepDisturbance, SocialFrequency, Symptom } from '../../types/daily-log.js';

interface DailyLogModalProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialLog?: CreateDailyLogInput | null;
}

const STEPS = ['Ánimo', 'Sueño', 'Actividad y vida social', 'Síntomas'] as const;

const DISTURBANCE_LABELS: Record<SleepDisturbance, string> = {
  none: 'Ninguna',
  insomnia: 'Insomnio',
  nightmares: 'Pesadillas',
  frequent_waking: 'Despertares frecuentes',
  early_waking: 'Despertar temprano',
};

const ACTIVITY_LABELS: Record<ActivityType, string> = {
  none: 'Ninguna',
  walking: 'Caminar',
  running: 'Correr',
  gym: 'Gimnasio',
  yoga: 'Yoga',
  cycling: 'Ciclismo',
  sports: 'Deporte',
  other: 'Otra',
};

const SOCIAL_LABELS: Record<SocialFrequency, string> = {
  none: 'Ninguna',
  rare: 'Poco frecuente',
  occasional: 'Ocasional',
  frequent: 'Frecuente',
  daily: 'A diario',
};

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultForm(initial?: CreateDailyLogInput | null): CreateDailyLogInput {
  return (
    initial ?? {
      logDate: todayIso(),
      moodRating: 3,
      anxietyLevel: 3,
      stressLevel: 3,
      sleepHours: 7,
      sleepQuality: 3,
      sleepDisturbances: [],
      activityType: null,
      activityMinutes: null,
      socialFrequency: 'occasional',
      symptoms: [],
      notes: null,
    }
  );
}

export function DailyLogModal({ open, onClose, onSaved, initialLog }: DailyLogModalProps) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CreateDailyLogInput>(defaultForm(initialLog));
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  function update<K extends keyof CreateDailyLogInput>(key: K, value: CreateDailyLogInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleDisturbance(disturbance: SleepDisturbance) {
    const has = form.sleepDisturbances.includes(disturbance);
    update(
      'sleepDisturbances',
      has ? form.sleepDisturbances.filter((d) => d !== disturbance) : [...form.sleepDisturbances, disturbance],
    );
  }

  function handleClose() {
    setStep(0);
    setForm(defaultForm(initialLog));
    onClose();
  }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      await logsApi.create(form);
      toast.show('Registro guardado. Gracias por tomarte el tiempo hoy.');
      onSaved();
      handleClose();
    } catch {
      toast.show('No pudimos guardar tu registro. Inténtalo de nuevo.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="¿Cómo ha sido tu día?">
      <div className="mb-5 flex gap-1.5" aria-hidden="true">
        {STEPS.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-sage-400' : 'bg-calm-100'}`} />
        ))}
      </div>
      <p className="mb-4 text-xs font-semibold uppercase tracking-wide text-dusk-300">
        Paso {step + 1} de {STEPS.length} · {STEPS[step]}
      </p>

      <div className="space-y-5">
        {step === 0 && <MoodScale value={form.moodRating} onChange={(v) => update('moodRating', v)} />}

        {step === 1 && (
          <div className="space-y-4">
            <SliderField
              id="sleepHours"
              label="Horas de sueño"
              min={0}
              max={14}
              value={form.sleepHours}
              onChange={(v) => update('sleepHours', v)}
              describe={(v) => `${v} h`}
            />
            <SliderField
              id="sleepQuality"
              label="Calidad del sueño"
              min={1}
              max={5}
              value={form.sleepQuality}
              onChange={(v) => update('sleepQuality', v)}
            />
            <div>
              <p className="mb-1.5 text-sm font-medium text-dusk-600">Disturbios (si hubo alguno)</p>
              <div className="flex flex-wrap gap-2">
                {(Object.keys(DISTURBANCE_LABELS) as SleepDisturbance[]).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => toggleDisturbance(d)}
                    aria-pressed={form.sleepDisturbances.includes(d)}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-200 ${
                      form.sleepDisturbances.includes(d)
                        ? 'border-transparent bg-dusk-500 text-white'
                        : 'border-dusk-100 text-dusk-400 hover:bg-calm-50'
                    }`}
                  >
                    {DISTURBANCE_LABELS[d]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <SliderField
              id="anxietyLevel"
              label="Nivel de ansiedad"
              min={1}
              max={10}
              value={form.anxietyLevel}
              onChange={(v) => update('anxietyLevel', v)}
              hint="1 es sin ansiedad perceptible, 10 es la ansiedad más intensa que hayas sentido."
            />
            <SliderField
              id="stressLevel"
              label="Nivel de estrés"
              min={1}
              max={10}
              value={form.stressLevel}
              onChange={(v) => update('stressLevel', v)}
              hint="1 es sin estrés, 10 es sentirte completamente desbordado."
            />
            <div>
              <label htmlFor="activityType" className="mb-1.5 block text-sm font-medium text-dusk-600">
                Actividad física
              </label>
              <select
                id="activityType"
                value={form.activityType ?? 'none'}
                onChange={(e) => update('activityType', e.target.value as ActivityType)}
                className="w-full rounded-xl2 border border-dusk-100 bg-white px-3 py-2 text-sm"
              >
                {(Object.keys(ACTIVITY_LABELS) as ActivityType[]).map((a) => (
                  <option key={a} value={a}>
                    {ACTIVITY_LABELS[a]}
                  </option>
                ))}
              </select>
            </div>
            {form.activityType && form.activityType !== 'none' && (
              <SliderField
                id="activityMinutes"
                label="Duración"
                min={0}
                max={180}
                value={form.activityMinutes ?? 0}
                onChange={(v) => update('activityMinutes', v)}
                describe={(v) => `${v} min`}
              />
            )}
            <div>
              <label htmlFor="socialFrequency" className="mb-1.5 block text-sm font-medium text-dusk-600">
                Interacciones sociales
              </label>
              <select
                id="socialFrequency"
                value={form.socialFrequency}
                onChange={(e) => update('socialFrequency', e.target.value as SocialFrequency)}
                className="w-full rounded-xl2 border border-dusk-100 bg-white px-3 py-2 text-sm"
              >
                {(Object.keys(SOCIAL_LABELS) as SocialFrequency[]).map((s) => (
                  <option key={s} value={s}>
                    {SOCIAL_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <SymptomPicker symptoms={form.symptoms} onChange={(s: Symptom[]) => update('symptoms', s)} />
            <div>
              <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-dusk-600">
                Notas (opcional)
              </label>
              <textarea
                id="notes"
                maxLength={1000}
                rows={3}
                value={form.notes ?? ''}
                onChange={(e) => update('notes', e.target.value || null)}
                className="w-full rounded-xl2 border border-dusk-100 bg-white px-3 py-2 text-sm"
                placeholder="¿Algo más que quieras recordar de hoy?"
              />
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          Atrás
        </Button>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={handleSubmit} disabled={submitting}>
            Guardar ahora
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>Siguiente</Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Guardando…' : 'Finalizar'}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}
