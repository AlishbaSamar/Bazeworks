const BASE = "h-5 w-5";

export function BoltIcon() {
  return (
    <svg className={BASE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 2 4 14h6l-1 8 9-12h-6l1-8z" />
    </svg>
  );
}

export function ShieldCheckIcon() {
  return (
    <svg className={BASE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 3l7 3v5c0 4.5-2.9 8.2-7 9.5-4.1-1.3-7-5-7-9.5V6l7-3z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
    </svg>
  );
}

export function GlobeIcon() {
  return (
    <svg className={BASE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3z"
      />
    </svg>
  );
}

export function LayersIcon() {
  return (
    <svg className={BASE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l9 5-9 5-9-5 9-5z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13l9 5 9-5" />
    </svg>
  );
}

export function DatabaseIcon() {
  return (
    <svg className={BASE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <ellipse cx="12" cy="6" rx="8" ry="3" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
    </svg>
  );
}

export function RocketIcon() {
  return (
    <svg className={BASE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.5 4.5c2.5-1 5-1 5-1s0 2.5-1 5-3.5 5.5-6 8l-3.5.5.5-3.5c2.5-2.5 5-5 7-6.5z"
      />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.5 14.5 6 18M8 12l-3.5 1L6 9M12 16l1 3.5 2.5-3.5" />
      <circle cx="15" cy="9" r="1.25" />
    </svg>
  );
}
