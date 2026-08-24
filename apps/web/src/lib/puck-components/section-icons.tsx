export const SECTION_ICON_NAMES = ["bolt", "shield", "rocket", "globe", "layers", "heart", "star", "check"] as const;
export type SectionIconName = (typeof SECTION_ICON_NAMES)[number];

const PATHS: Record<SectionIconName, string> = {
  bolt: "M13 2 4 14h6l-1 8 9-12h-6l1-8z",
  shield: "M12 3l7 3v5c0 4.5-2.9 8.2-7 9.5-4.1-1.3-7-5-7-9.5V6l7-3z",
  rocket: "M14.5 4.5c2.5-1 5-1 5-1s0 2.5-1 5-3.5 5.5-6 8l-3.5.5.5-3.5c2.5-2.5 5-5 7-6.5z",
  globe: "M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3z",
  layers: "M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5",
  heart: "M12 21s-7-4.35-9.5-9C.5 8 2 4 6 4c2 0 3.5 1.2 4.5 2.7C11.5 5.2 13 4 15 4c4 0 5.5 4 3.5 8-2.5 4.65-9.5 9-9.5 9z",
  star: "M12 2.5l2.9 6 6.6.8-4.8 4.6 1.2 6.5L12 17l-5.9 3.4 1.2-6.5-4.8-4.6 6.6-.8L12 2.5z",
  check: "M5 12.5l4.5 4.5L19 7",
};

export function SectionIcon({ name, className = "h-5 w-5" }: { name: SectionIconName; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}

export const SECTION_ICON_OPTIONS = SECTION_ICON_NAMES.map((name) => ({
  label: name.charAt(0).toUpperCase() + name.slice(1),
  value: name,
}));
