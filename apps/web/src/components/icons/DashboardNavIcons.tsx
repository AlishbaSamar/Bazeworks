const BASE = "h-[18px] w-[18px]";

export function DashboardIcon() {
  return (
    <svg className={BASE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="4.5" rx="1.5" />
      <rect x="13.5" y="11" width="7" height="9.5" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function WebsitesIcon() {
  return (
    <svg className={BASE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <path strokeLinecap="round" d="M3.5 9h17" />
      <circle cx="6" cy="6.75" r="0.5" fill="currentColor" stroke="none" />
      <circle cx="8" cy="6.75" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TemplatesIcon() {
  return (
    <svg className={BASE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
      <path strokeLinecap="round" d="M3.5 9.5h17M9.5 9.5V20.5" />
    </svg>
  );
}

export function CollectionsIcon() {
  return (
    <svg className={BASE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <ellipse cx="12" cy="6" rx="8" ry="3" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
    </svg>
  );
}

export function MembersIcon() {
  return (
    <svg className={BASE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="9" cy="8" r="3.25" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.5 19c0-3 2.46-5 5.5-5s5.5 2 5.5 5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 5.5a3 3 0 010 5.5M17 19c0-2.4-1-4.2-2.5-5" />
    </svg>
  );
}

export function MediaIcon() {
  return (
    <svg className={BASE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="8.5" cy="9.5" r="1.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 17l5-5 3.5 3.5L16 12l4.5 5" />
    </svg>
  );
}

export function SettingsIcon() {
  return (
    <svg className={BASE} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.4 13a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 11-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V19a2 2 0 11-4 0v-.09a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 11-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H4a2 2 0 110-4h.09a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 112.83-2.83l.06.06a1.65 1.65 0 001.82.33H10a1.65 1.65 0 001-1.51V4a2 2 0 114 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 112.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V10a1.65 1.65 0 001.51 1H20a2 2 0 110 4h-.09a1.65 1.65 0 00-1.51 1z"
      />
    </svg>
  );
}
