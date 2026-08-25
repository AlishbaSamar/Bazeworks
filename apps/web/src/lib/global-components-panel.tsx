"use client";

import { createContext, useContext, useMemo } from "react";
import { AutoField, FieldLabel, type Field } from "@puckeditor/core";
import { sectionComponents, type NavbarProps, type FooterProps } from "./puck-components/sections";

interface GlobalComponentsContextValue {
  header: NavbarProps;
  footer: FooterProps;
  onHeaderChange: (header: NavbarProps) => void;
  onFooterChange: (footer: FooterProps) => void;
}

const GlobalComponentsContext = createContext<GlobalComponentsContextValue | null>(null);

/**
 * Mirrors Navbar/Footer's own defaultProps (sections.tsx) so a website
 * whose globalHeader/globalFooter is still `{}` — the raw Prisma column
 * default, e.g. for a website created before this feature existed — never
 * hits a missing `links` array in the render functions below.
 */
export const DEFAULT_GLOBAL_HEADER: NavbarProps = {
  logoText: "Brand",
  links: [
    { label: "Features", url: "#" },
    { label: "Pricing", url: "#" },
    { label: "About", url: "#" },
  ],
  ctaText: "Get Started",
  ctaUrl: "#",
  showCta: true,
};

export const DEFAULT_GLOBAL_FOOTER: FooterProps = {
  logoText: "Brand",
  tagline: "Building something great.",
  links: [
    { label: "Privacy", url: "#" },
    { label: "Terms", url: "#" },
    { label: "Contact", url: "#" },
  ],
  copyrightText: `© ${new Date().getFullYear()} Brand. All rights reserved.`,
};

export function withGlobalHeaderDefaults(header: Partial<NavbarProps> | null | undefined): NavbarProps {
  return { ...DEFAULT_GLOBAL_HEADER, ...header };
}

export function withGlobalFooterDefaults(footer: Partial<FooterProps> | null | undefined): FooterProps {
  return { ...DEFAULT_GLOBAL_FOOTER, ...footer };
}

/**
 * Wrap <Puck> with this so the header/footer plugins (stable identity, see
 * HEADER_FOOTER_PLUGINS below) can read the *current* global header/footer
 * via context on every render instead of capturing it in a closure — same
 * fix as the theme panel's focus-loss bug (see theme-panel.tsx).
 */
export function GlobalComponentsProvider({
  header,
  footer,
  onHeaderChange,
  onFooterChange,
  children,
}: GlobalComponentsContextValue & { children: React.ReactNode }) {
  const value = useMemo(
    () => ({ header, footer, onHeaderChange, onFooterChange }),
    [header, footer, onHeaderChange, onFooterChange],
  );
  return <GlobalComponentsContext.Provider value={value}>{children}</GlobalComponentsContext.Provider>;
}

export function useGlobalComponents() {
  const ctx = useContext(GlobalComponentsContext);
  if (!ctx) {
    throw new Error("useGlobalComponents must be used within GlobalComponentsProvider");
  }
  return ctx;
}

function GlobalBanner() {
  return (
    <div className="mx-3 mt-3 flex items-center gap-2 rounded-md border border-border bg-surface-sunken px-3 py-2 text-xs text-muted-foreground">
      <svg className="h-3.5 w-3.5 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.94 6.94a.75.75 0 111.06 1.06L9.19 9h1.56a.75.75 0 010 1.5H9.19l.81 1a.75.75 0 11-1.06 1.06L7.4 11.03a1 1 0 010-1.06l1.54-1.53z"
          clipRule="evenodd"
        />
      </svg>
      Editing globally — visible on every page of this website
    </div>
  );
}

function FieldList({
  fields,
  values,
  onChange,
}: {
  fields: Record<string, Field>;
  values: Record<string, unknown>;
  onChange: (key: string, value: unknown) => void;
}) {
  return (
    <div className="flex flex-col gap-4 p-3">
      {Object.entries(fields).map(([key, field]) => (
        <FieldLabel key={key} label={field.label ?? key} icon={field.labelIcon}>
          <AutoField field={field} value={values[key]} onChange={(value) => onChange(key, value)} id={`global-${key}`} />
        </FieldLabel>
      ))}
    </div>
  );
}

function ConnectedHeaderPanel() {
  const { header, onHeaderChange } = useGlobalComponents();
  const fields = sectionComponents.Navbar!.fields as unknown as Record<string, Field>;
  return (
    <div className="flex flex-col">
      <GlobalBanner />
      <FieldList
        fields={fields}
        values={header as unknown as Record<string, unknown>}
        onChange={(key, value) => onHeaderChange({ ...header, [key]: value })}
      />
    </div>
  );
}

function ConnectedFooterPanel() {
  const { footer, onFooterChange } = useGlobalComponents();
  const fields = sectionComponents.Footer!.fields as unknown as Record<string, Field>;
  return (
    <div className="flex flex-col">
      <GlobalBanner />
      <FieldList
        fields={fields}
        values={footer as unknown as Record<string, unknown>}
        onChange={(key, value) => onFooterChange({ ...footer, [key]: value })}
      />
    </div>
  );
}

function HeaderIcon() {
  return (
    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="3" y="4.5" width="18" height="4" rx="1" />
      <path strokeLinecap="round" d="M3 13h18M3 17h10" />
    </svg>
  );
}

function FooterIcon() {
  return (
    <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" d="M3 7h18M3 11h10" />
      <rect x="3" y="15.5" width="18" height="4" rx="1" />
    </svg>
  );
}

export const headerPlugin = {
  name: "global-header",
  label: "Header",
  icon: <HeaderIcon />,
  render: () => <ConnectedHeaderPanel />,
};

export const footerPlugin = {
  name: "global-footer",
  label: "Footer",
  icon: <FooterIcon />,
  render: () => <ConnectedFooterPanel />,
};

export const HEADER_FOOTER_PLUGINS = [headerPlugin, footerPlugin];

const NavbarComponent = sectionComponents.Navbar!.render as (props: NavbarProps) => React.ReactElement;
const FooterComponent = sectionComponents.Footer!.render as (props: FooterProps) => React.ReactElement;

/**
 * Wraps every page's own editable content with the website's shared global
 * header/footer — used as puckConfig.root.render, so it's rendered inside
 * Puck's canvas iframe. Reads live values via context (propagated through
 * Puck's iframe portal, same as any other React context) rather than a
 * closure, so header/footer edits show up on the canvas immediately.
 */
export function GlobalHeaderFooterWrapper({ children }: { children: React.ReactNode }) {
  const { header, footer } = useGlobalComponents();
  return (
    <>
      <NavbarComponent {...header} />
      {children}
      <FooterComponent {...footer} />
    </>
  );
}
