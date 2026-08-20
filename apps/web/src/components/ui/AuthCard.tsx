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
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-12">
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
          B
        </div>
        <span className="text-lg font-semibold text-foreground">Bazeworks</span>
      </div>

      <div className="w-full max-w-[400px] rounded-lg border border-border bg-surface p-8 shadow-sm">
        <div className="mb-6 flex flex-col gap-1.5">
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
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
