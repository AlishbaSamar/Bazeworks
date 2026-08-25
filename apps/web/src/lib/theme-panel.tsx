"use client";

import { createContext, useContext, useMemo } from "react";
import { FONT_OPTIONS, FONT_WEIGHTS, SPACING_SCALES, type Theme } from "./theme";

interface ThemeContextValue {
  theme: Theme;
  onChange: (theme: Theme) => void;
}

const ThemeEditContext = createContext<ThemeContextValue | null>(null);

/**
 * Wrap <Puck> with this so the theme plugin (created once, with a stable
 * identity — see createThemePlugin below) can read the *current* theme via
 * context on every render instead of capturing it in a closure. Passing a
 * freshly-built plugin object to Puck on every keystroke would make Puck
 * treat it as a new plugin and remount the panel, dropping input focus
 * after a single character.
 */
export function ThemeEditProvider({ theme, onChange, children }: ThemeContextValue & { children: React.ReactNode }) {
  const value = useMemo(() => ({ theme, onChange }), [theme, onChange]);
  return <ThemeEditContext.Provider value={value}>{children}</ThemeEditContext.Provider>;
}

function ConnectedThemeSettingsPanel() {
  const ctx = useContext(ThemeEditContext);
  if (!ctx) return null;
  return <ThemeSettingsPanel theme={ctx.theme} onChange={ctx.onChange} />;
}

function ThemeIcon() {
  return (
    <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path strokeLinecap="round" d="M12 3a4.5 4.5 0 000 9 3 3 0 010 6" />
      <circle cx="8.5" cy="10.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="8.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2 rounded-md border border-border bg-white px-2.5 py-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-6 w-6 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0"
          aria-label={label}
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-transparent text-sm text-foreground uppercase focus:outline-none"
          spellCheck={false}
        />
      </div>
    </Field>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-full rounded-md border border-border bg-white px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </Field>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const next = Number(e.target.value);
          if (!Number.isNaN(next)) onChange(next);
        }}
        className="h-9 w-full rounded-md border border-border bg-white px-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    </Field>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{children}</p>;
}

export function ThemeSettingsPanel({ theme, onChange }: { theme: Theme; onChange: (theme: Theme) => void }) {
  return (
    <div className="flex flex-col gap-6 p-3">
      <div className="flex flex-col gap-3">
        <SectionTitle>Colors</SectionTitle>
        <div className="grid grid-cols-2 gap-3">
          <ColorField label="Primary" value={theme.colors.primary} onChange={(v) => onChange({ ...theme, colors: { ...theme.colors, primary: v } })} />
          <ColorField label="Secondary" value={theme.colors.secondary} onChange={(v) => onChange({ ...theme, colors: { ...theme.colors, secondary: v } })} />
          <ColorField label="Background" value={theme.colors.background} onChange={(v) => onChange({ ...theme, colors: { ...theme.colors, background: v } })} />
          <ColorField label="Text" value={theme.colors.text} onChange={(v) => onChange({ ...theme, colors: { ...theme.colors, text: v } })} />
          <ColorField label="Accent" value={theme.colors.accent} onChange={(v) => onChange({ ...theme, colors: { ...theme.colors, accent: v } })} />
          <ColorField label="Border" value={theme.colors.border} onChange={(v) => onChange({ ...theme, colors: { ...theme.colors, border: v } })} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <SectionTitle>Typography</SectionTitle>
        <SelectField
          label="Heading font"
          value={theme.typography.headingFont}
          options={FONT_OPTIONS}
          onChange={(v) => onChange({ ...theme, typography: { ...theme.typography, headingFont: v as Theme["typography"]["headingFont"] } })}
        />
        <SelectField
          label="Body font"
          value={theme.typography.bodyFont}
          options={FONT_OPTIONS}
          onChange={(v) => onChange({ ...theme, typography: { ...theme.typography, bodyFont: v as Theme["typography"]["bodyFont"] } })}
        />
        <NumberField
          label="Base font size (px)"
          value={theme.typography.baseFontSize}
          min={12}
          max={24}
          onChange={(v) => onChange({ ...theme, typography: { ...theme.typography, baseFontSize: v } })}
        />
        <div className="grid grid-cols-2 gap-3">
          <SelectField
            label="Heading weight"
            value={theme.typography.headingWeight}
            options={FONT_WEIGHTS}
            onChange={(v) => onChange({ ...theme, typography: { ...theme.typography, headingWeight: v as Theme["typography"]["headingWeight"] } })}
          />
          <SelectField
            label="Body weight"
            value={theme.typography.bodyWeight}
            options={FONT_WEIGHTS}
            onChange={(v) => onChange({ ...theme, typography: { ...theme.typography, bodyWeight: v as Theme["typography"]["bodyWeight"] } })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <SectionTitle>Layout</SectionTitle>
        <NumberField
          label="Container width (px)"
          value={theme.layout.containerWidth}
          min={640}
          max={1600}
          onChange={(v) => onChange({ ...theme, layout: { ...theme.layout, containerWidth: v } })}
        />
        <NumberField
          label="Border radius (px)"
          value={theme.layout.borderRadius}
          min={0}
          max={32}
          onChange={(v) => onChange({ ...theme, layout: { ...theme.layout, borderRadius: v } })}
        />
        <SelectField
          label="Spacing scale"
          value={theme.layout.spacingScale}
          options={SPACING_SCALES}
          onChange={(v) => onChange({ ...theme, layout: { ...theme.layout, spacingScale: v as Theme["layout"]["spacingScale"] } })}
        />
      </div>
    </div>
  );
}

/**
 * A single, stable plugin object — created once at module scope, not per
 * render — so its identity never changes across re-renders. Pair with
 * ThemeEditProvider (which the panel reads via context) to get live theme
 * updates without Puck seeing a "new" plugin on every keystroke.
 */
export const themePlugin = {
  name: "site-theme",
  label: "Theme",
  icon: <ThemeIcon />,
  render: () => <ConnectedThemeSettingsPanel />,
};

export const THEME_PLUGINS = [themePlugin];
