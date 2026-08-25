/**
 * Seeded onto every new website's globalHeader/globalFooter columns so
 * pages look complete immediately, without requiring the user to configure
 * a header/footer before anything renders. Mirrors Navbar/Footer's
 * defaultProps in apps/web/src/lib/puck-components/sections.tsx.
 */

export const DEFAULT_GLOBAL_HEADER: Record<string, unknown> = {
  logoText: 'Brand',
  links: [
    { label: 'Features', url: '#' },
    { label: 'Pricing', url: '#' },
    { label: 'About', url: '#' },
  ],
  ctaText: 'Get Started',
  ctaUrl: '#',
  showCta: true,
};

export const DEFAULT_GLOBAL_FOOTER: Record<string, unknown> = {
  logoText: 'Brand',
  tagline: 'Building something great.',
  links: [
    { label: 'Privacy', url: '#' },
    { label: 'Terms', url: '#' },
    { label: 'Contact', url: '#' },
  ],
  copyrightText: `© ${new Date().getFullYear()} Brand. All rights reserved.`,
};
