import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage.js';
import { ProtectedRoute } from './components/ProtectedRoute.js';

// Recharts and socket.io-client are only needed once a user is past login — lazy-loading the
// dashboard keeps them out of the initial bundle the login screen has to download.
const DashboardPage = lazy(() =>
  import('./pages/DashboardPage.js').then((m) => ({ default: m.DashboardPage })),
);

function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-paper-100">
      <p className="animate-fade-in font-mono text-sm text-ink-400">Cargando…</p>
    </div>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageFallback />}>
              <DashboardPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
