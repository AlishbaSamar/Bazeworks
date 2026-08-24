export const FONT_OPTIONS = [
  "Inter",
  "Poppins",
  "Playfair Display",
  "Merriweather",
  "Roboto",
  "Montserrat",
] as const;

export type FontOption = (typeof FONT_OPTIONS)[number];

export const FONT_WEIGHTS = ["400", "500", "600", "700", "800"] as const;
export type FontWeight = (typeof FONT_WEIGHTS)[number];

export const SPACING_SCALES = ["compact", "comfortable", "spacious"] as const;
export type SpacingScale = (typeof SPACING_SCALES)[number];

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
  border: string;
}

export interface ThemeTypography {
  headingFont: FontOption;
  bodyFont: FontOption;
  baseFontSize: number;
  headingWeight: FontWeight;
  bodyWeight: FontWeight;
}

export interface ThemeLayout {
  containerWidth: number;
  borderRadius: number;
  spacingScale: SpacingScale;
}

export interface Theme {
  colors: ThemeColors;
  typography: ThemeTypography;
  layout: ThemeLayout;
}

export const DEFAULT_THEME: Theme = {
  colors: {
    primary: "#4F46E5",
    secondary: "#0EA5E9",
    background: "#FFFFFF",
    text: "#111827",
    accent: "#F59E0B",
    border: "#E5E7EB",
  },
  typography: {
    headingFont: "Inter",
    bodyFont: "Inter",
    baseFontSize: 16,
    headingWeight: "700",
    bodyWeight: "400",
  },
  layout: {
    containerWidth: 1200,
    borderRadius: 8,
    spacingScale: "comfortable",
  },
};

const SPACING_SCALE_MULTIPLIER: Record<SpacingScale, number> = {
  compact: 0.75,
  comfortable: 1,
  spacious: 1.35,
};

/**
 * Merges a possibly-partial/empty theme (a fresh website's `theme` column
 * defaults to `{}`) with DEFAULT_THEME so every consumer always has a
 * complete, valid theme to render against.
 */
export function withThemeDefaults(theme: Partial<Theme> | null | undefined): Theme {
  return {
    colors: { ...DEFAULT_THEME.colors, ...theme?.colors },
    typography: { ...DEFAULT_THEME.typography, ...theme?.typography },
    layout: { ...DEFAULT_THEME.layout, ...theme?.layout },
  };
}

/**
 * Site-content CSS custom properties, namespaced with `--site-` so they
 * never collide with Bazeworks' own app-level design tokens (--primary,
 * --background, etc. in globals.css) — those style the dashboard/editor
 * chrome, these style the website the user is building, which has its own
 * independent, user-chosen palette.
 */
export function themeToCssVars(theme: Theme): Record<string, string> {
  const spacingUnit = 4 * SPACING_SCALE_MULTIPLIER[theme.layout.spacingScale];
  return {
    "--site-color-primary": theme.colors.primary,
    "--site-color-secondary": theme.colors.secondary,
    "--site-color-background": theme.colors.background,
    "--site-color-text": theme.colors.text,
    "--site-color-accent": theme.colors.accent,
    "--site-color-border": theme.colors.border,
    "--site-font-heading": `"${theme.typography.headingFont}", ui-sans-serif, system-ui, sans-serif`,
    "--site-font-body": `"${theme.typography.bodyFont}", ui-sans-serif, system-ui, sans-serif`,
    "--site-font-size-base": `${theme.typography.baseFontSize}px`,
    "--site-font-weight-heading": theme.typography.headingWeight,
    "--site-font-weight-body": theme.typography.bodyWeight,
    "--site-container-width": `${theme.layout.containerWidth}px`,
    "--site-radius": `${theme.layout.borderRadius}px`,
    "--site-spacing-unit": `${spacingUnit}px`,
  };
}

export function themeCssVarsToStyleText(theme: Theme): string {
  const vars = themeToCssVars(theme);
  const declarations = Object.entries(vars)
    .map(([key, value]) => `  ${key}: ${value};`)
    .join("\n");
  return `:root {\n${declarations}\n}`;
}

export function googleFontsHref(fonts: FontOption[]): string {
  const families = Array.from(new Set(fonts))
    .map((font) => `family=${encodeURIComponent(font)}:wght@400;500;600;700;800`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
