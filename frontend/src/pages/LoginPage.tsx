import { useEffect, useState } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth.js';
import { Logo } from '../components/ui/Logo.js';

export function LoginPage() {
  const { user, loading } = useAuth();
  const [params] = useSearchParams();
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    setShowError(params.get('error') === 'auth_failed');
  }, [params]);

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-paper-100 px-4">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-70 blur-2xl"
        style={{
          background: 'linear-gradient(180deg, #D7E6EA 0%, #F6F1E7 55%, transparent 100%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full opacity-40 blur-3xl"
        style={{ background: '#F3DCC9' }}
      />

      <div className="relative w-full max-w-sm animate-slide-up rounded-xl2 border border-ink-100 bg-white/90 p-8 text-center shadow-sm backdrop-blur">
        <Logo className="mx-auto h-14 w-14" />
        <h1 className="mt-5 font-display text-2xl font-semibold text-ink-700">Bitácora</h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-500">
          Un espacio tranquilo para anotar cómo va cada día. Sin calificarlo — solo registrarlo.
        </p>

        {showError && (
          <p className="mt-4 rounded-lg border border-ink-100 bg-paper-100 px-3 py-2 text-sm text-ink-600" role="alert">
            No pudimos completar el inicio de sesión. Inténtalo de nuevo.
          </p>
        )}

        <a
          href="/api/auth/google"
          className="mt-6 flex w-full items-center justify-center gap-3 rounded-lg border border-ink-100 bg-white px-4 py-3 font-medium text-ink-700 shadow-sm transition hover:shadow-md focus-visible:ring-2 focus-visible:ring-clearsky-400"
        >
          <GoogleIcon />
          Continuar con Google
        </a>

        <p className="mt-6 font-mono text-xs text-ink-300">Tus notas son privadas. Solo tú puedes leerlas.</p>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.94v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.68 9c0-.59.1-1.16.27-1.7V4.97H.94A9 9 0 0 0 0 9c0 1.45.35 2.83.94 4.03l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .94 4.97l3.01 2.33C4.66 5.17 6.65 3.58 9 3.58Z"
      />
    </svg>
  );
}
