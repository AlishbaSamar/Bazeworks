import Link from "next/link";
import type { ReactNode } from "react";

interface Feature {
  icon: ReactNode;
  title: string;
  description: string;
}

export function AuthSplitLayout({
  headline,
  subheading,
  features,
  mockup,
  title,
  subtitle,
  footer,
  children,
}: {
  headline: string;
  subheading: string;
  features: Feature[];
  mockup: ReactNode;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="bg-dot-grid relative hidden w-1/2 flex-col justify-center gap-10 overflow-hidden border-r border-border px-16 py-12 lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-foreground/4 blur-3xl"
        />
        <Link href="/" className="relative flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
            B
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">Bazeworks</span>
        </Link>

        <div className="relative max-w-md">
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-foreground text-balance">
            {headline}
          </h1>
          <p className="mt-4 text-base text-muted-foreground">{subheading}</p>
        </div>

        <div className="relative max-w-md">{mockup}</div>

        <div className="relative grid max-w-md grid-cols-3 gap-6">
          {features.map((feature) => (
            <div key={feature.title} className="flex flex-col gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
                {feature.icon}
              </div>
              <p className="text-sm font-semibold text-foreground">{feature.title}</p>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex w-full flex-col items-center justify-center px-4 py-12 lg:w-1/2">
        <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
            B
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">Bazeworks</span>
        </Link>

        <div className="w-full max-w-100">
          <div className="mb-7 flex flex-col gap-1.5">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>

          {children}

          {footer && <div className="mt-6 text-sm text-muted-foreground">{footer}</div>}
        </div>

        <div className="mt-10 flex gap-6 text-xs text-muted-foreground">
          <Link href="#" className="hover:text-foreground">
            Privacy Policy
          </Link>
          <Link href="#" className="hover:text-foreground">
            Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}
