export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      role="status"
      aria-label="Cargando"
      className={`flex items-center justify-center gap-1.5 rounded-xl2 border border-ink-100 bg-paper-50 ${className}`}
    >
      <span className="h-2 w-2 animate-breathe rounded-full bg-ink-300" style={{ animationDelay: '0ms' }} />
      <span className="h-2 w-2 animate-breathe rounded-full bg-ink-300" style={{ animationDelay: '150ms' }} />
      <span className="h-2 w-2 animate-breathe rounded-full bg-ink-300" style={{ animationDelay: '300ms' }} />
    </div>
  );
}
