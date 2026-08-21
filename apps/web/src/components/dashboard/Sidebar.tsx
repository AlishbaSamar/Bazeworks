const NAV_ITEMS = [
  { label: "Dashboard", active: true },
  { label: "Websites", active: false },
  { label: "Media", active: false },
  { label: "Members", active: false },
  { label: "Settings", active: false },
] as const;

export function Sidebar() {
  return (
    <nav className="flex w-56 shrink-0 flex-col gap-1 border-r border-border bg-surface p-4">
      {NAV_ITEMS.map((item) => (
        <div
          key={item.label}
          title={item.active ? undefined : "Coming soon"}
          className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            item.active
              ? "bg-background text-foreground"
              : "cursor-not-allowed text-muted-foreground/60"
          }`}
        >
          {item.label}
        </div>
      ))}
    </nav>
  );
}
