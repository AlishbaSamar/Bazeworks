import Link from "next/link";

export function AuthCard({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="bg-dot-grid flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
          B
        </div>
        <span className="text-lg font-semibold tracking-tight text-foreground">Bazeworks</span>
      </Link>

      <div className="w-full max-w-100 rounded-2xl border border-border bg-surface p-8 shadow-xl">
        <div className="mb-6 flex flex-col gap-1.5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {children}
      </div>

      {footer && <div className="mt-6 text-sm text-muted-foreground">{footer}</div>}

      <div className="mt-10 flex gap-6 text-xs text-muted-foreground">
        <Link href="#" className="hover:text-foreground">
          Privacy
        </Link>
        <Link href="#" className="hover:text-foreground">
          Terms
        </Link>
        <Link href="#" className="hover:text-foreground">
          Help
        </Link>
      </div>
    </div>
  );
}
