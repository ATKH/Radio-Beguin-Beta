function WizzIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {/* point central rempli */}
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />

        {/* petits traits proches (noyau qui pulse) */}
        <line x1="12" y1="6" x2="12" y2="8" />
        <line x1="12" y1="16" x2="12" y2="18" />
        <line x1="6" y1="12" x2="8" y2="12" />
        <line x1="16" y1="12" x2="18" y2="12" />

        {/* arcs diagonaux externes */}
        <path d="M7 7 A7 7 0 0 1 9 5" />
        <path d="M17 7 A7 7 0 0 0 15 5" />
        <path d="M7 17 A7 7 0 0 0 9 19" />
        <path d="M17 17 A7 7 0 0 1 15 19" />
      </g>
    </svg>
  );
}
