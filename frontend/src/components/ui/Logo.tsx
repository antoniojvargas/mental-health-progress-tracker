export function Logo({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <span
      className={`flex flex-none items-center justify-center rounded-full bg-clearsky-100 text-clearsky-600 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[55%] w-[55%]"
        aria-hidden="true"
      >
        <path d="M12 6.5c-1.8-1.3-4-2-6-2v11c2 0 4.2.7 6 2 1.8-1.3 4-2 6-2v-11c-2 0-4.2.7-6 2Z" />
        <path d="M12 6.5v11" />
      </svg>
    </span>
  );
}
