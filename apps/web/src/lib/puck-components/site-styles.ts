import type { CSSProperties } from "react";

/**
 * CSS custom properties driven by each website's own theme (see
 * ../theme.ts) — namespaced `--site-*` so they never collide with
 * Bazeworks' own app-level tokens in globals.css. Every Layout and
 * Website Section component styles itself through these, never through
 * hardcoded colors, so the whole page reacts live to theme changes.
 */
export const SITE = {
  primary: "var(--site-color-primary)",
  secondary: "var(--site-color-secondary)",
  background: "var(--site-color-background)",
  text: "var(--site-color-text)",
  accent: "var(--site-color-accent)",
  border: "var(--site-color-border)",
  fontHeading: "var(--site-font-heading)",
  fontBody: "var(--site-font-body)",
  fontSizeBase: "var(--site-font-size-base)",
  weightHeading: "var(--site-font-weight-heading)",
  weightBody: "var(--site-font-weight-body)",
  containerWidth: "var(--site-container-width)",
  radius: "var(--site-radius)",
  spacingUnit: "var(--site-spacing-unit)",
} as const;

export function spacing(multiplier: number): string {
  return `calc(${SITE.spacingUnit} * ${multiplier})`;
}

export const headingStyle: CSSProperties = {
  fontFamily: SITE.fontHeading,
  fontWeight: SITE.weightHeading,
  color: SITE.text,
};

export const bodyStyle: CSSProperties = {
  fontFamily: SITE.fontBody,
  fontWeight: SITE.weightBody,
  color: SITE.text,
  fontSize: SITE.fontSizeBase,
};

export const PADDING_Y_PX: Record<"small" | "medium" | "large", number> = {
  small: 3,
  medium: 6,
  large: 10,
};

export const GAP_MULTIPLIER: Record<"small" | "medium" | "large", number> = {
  small: 2,
  medium: 4,
  large: 8,
};
