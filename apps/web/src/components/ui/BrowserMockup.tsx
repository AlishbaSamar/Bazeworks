export function BrowserMockup({
  eyebrow,
  heading,
  body,
  cta,
  nav,
}: {
  eyebrow?: string;
  heading: string;
  body: string;
  cta: string;
  nav?: string[];
}) {
  const navItems = nav ?? ["Features", "Pricing", "About"];

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xl ring-1 ring-black/[0.02]">
      <div className="flex items-center gap-3 border-b border-border bg-surface-sunken px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
          <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
        </div>
        <div className="flex h-6 flex-1 items-center gap-1.5 rounded-md border border-border bg-white px-2.5 text-xs text-muted-foreground">
          <svg className="h-3 w-3 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z"
              clipRule="evenodd"
            />
          </svg>
          bazeworks.app/preview
        </div>
      </div>

      <div className="flex items-center justify-between border-b border-border px-6 py-3.5">
        <div className="flex items-center gap-1.5">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-foreground text-[10px] font-bold text-background">
            B
          </div>
          <div className="h-2 w-14 rounded-full bg-foreground/70" />
        </div>
        <div className="hidden items-center gap-4 sm:flex">
          {navItems.map((item) => (
            <span key={item} className="text-xs text-muted-foreground">
              {item}
            </span>
          ))}
          <span className="rounded-md bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground">
            Get Started
          </span>
        </div>
      </div>

      <div className="bg-dot-grid px-6 py-9 text-center">
        {eyebrow && (
          <span className="inline-block rounded-full border border-border bg-white px-2.5 py-1 text-xs font-medium text-foreground shadow-sm">
            {eyebrow}
          </span>
        )}
        <h3 className={`text-xl font-semibold tracking-tight text-foreground ${eyebrow ? "mt-3.5" : ""}`}>
          {heading}
        </h3>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{body}</p>
        <span className="mt-4 inline-flex h-9 items-center rounded-md bg-primary px-4 text-xs font-semibold text-primary-foreground shadow-sm">
          {cta}
        </span>
        <div className="mt-7 grid grid-cols-3 gap-2.5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
              <div className="flex h-10 items-center justify-center bg-surface-sunken">
                <svg className="h-3.5 w-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
                  <circle cx="8.5" cy="9.5" r="1.5" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 17l5-5 3.5 3.5L16 12l4.5 5" />
                </svg>
              </div>
              <div className="space-y-1 px-2 py-2">
                <div className="h-1.5 w-3/4 rounded-full bg-border-strong" />
                <div className="h-1.5 w-1/2 rounded-full bg-border" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
