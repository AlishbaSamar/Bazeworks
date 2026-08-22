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
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex items-center gap-1.5 border-b border-border bg-background px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
        <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
        <span className="h-2.5 w-2.5 rounded-full bg-border-strong" />
        <span className="ml-3 rounded border border-border bg-white px-2.5 py-1 text-xs text-muted-foreground">
          bazeworks.app
        </span>
      </div>

      {nav && (
        <div className="flex items-center justify-between border-b border-border px-6 py-3">
          <div className="h-2.5 w-14 rounded bg-foreground/80" />
          <div className="flex items-center gap-4">
            {nav.map((item) => (
              <span key={item} className="text-xs text-muted-foreground">
                {item}
              </span>
            ))}
            <span className="rounded bg-primary px-2.5 py-1 text-[11px] font-medium text-primary-foreground">
              CTA
            </span>
          </div>
        </div>
      )}

      <div className="px-6 py-8 text-center">
        {eyebrow && (
          <span className="inline-block rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
            {eyebrow}
          </span>
        )}
        <h3 className={`text-lg font-semibold text-foreground ${eyebrow ? "mt-3" : ""}`}>{heading}</h3>
        <p className="mx-auto mt-2 max-w-xs text-sm text-muted-foreground">{body}</p>
        <span className="mt-4 inline-flex h-8 items-center rounded-md bg-primary px-4 text-xs font-medium text-primary-foreground">
          {cta}
        </span>
        <div className="mt-6 grid grid-cols-3 gap-2">
          <div className="h-14 rounded-md bg-background" />
          <div className="h-14 rounded-md bg-background" />
          <div className="h-14 rounded-md bg-background" />
        </div>
      </div>
    </div>
  );
}
