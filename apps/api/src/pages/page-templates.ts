import { randomUUID } from 'crypto';
import type { PageType } from './dto/create-page.dto';

/**
 * Default Puck content seeded per page type at creation time. Mirrors the
 * component prop shapes defined in apps/web/src/lib/puck-components/*.tsx —
 * there's no shared types package in this monorepo, so this is a deliberate,
 * hand-kept mirror (same convention already used for Website/Page fields
 * between Prisma and the frontend's hand-written interfaces).
 */

function component(type: string, props: Record<string, unknown>) {
  return {
    type,
    props: { id: `${type.toLowerCase()}-${randomUUID()}`, ...props },
  };
}

const hero = (overrides: Record<string, unknown> = {}) =>
  component('Hero', {
    eyebrow: '',
    heading: 'Build faster with a clear, confident story',
    subheading:
      "A short, honest sentence about what this product does and who it's for.",
    primaryCtaText: 'Get Started',
    primaryCtaUrl: '#',
    secondaryCtaText: 'Learn more',
    secondaryCtaUrl: '#',
    showSecondaryCta: true,
    align: 'center',
    ...overrides,
  });

const features = (overrides: Record<string, unknown> = {}) =>
  component('Features', {
    heading: 'Everything you need',
    subheading: 'A short line describing the value of these features together.',
    items: [
      {
        icon: 'bolt',
        title: 'Fast by default',
        description: 'Every screen is optimized so nothing feels slow.',
      },
      {
        icon: 'shield',
        title: 'Secure at the core',
        description: 'Role-based access and safe defaults everywhere.',
      },
      {
        icon: 'rocket',
        title: 'Ready to ship',
        description: 'Go from idea to production without extra tooling.',
      },
    ],
    columns: '3',
    ...overrides,
  });

const testimonials = () =>
  component('Testimonials', {
    heading: 'What people are saying',
    items: [
      {
        quote: 'This completely changed how our team ships.',
        authorName: 'Jamie Rivera',
        authorRole: 'Head of Product',
      },
      {
        quote: 'Setup took minutes, not weeks.',
        authorName: 'Alex Chen',
        authorRole: 'Founder',
      },
    ],
    columns: '2',
  });

const pricing = () =>
  component('Pricing', {
    heading: 'Simple, transparent pricing',
    subheading: 'Pick the plan that fits, upgrade any time.',
    tiers: [
      {
        name: 'Starter',
        price: '$0',
        description: 'For getting started',
        features: '1 website\nBasic support',
        ctaText: 'Get Started',
        ctaUrl: '#',
        highlighted: false,
      },
      {
        name: 'Pro',
        price: '$29/mo',
        description: 'For growing teams',
        features: 'Unlimited websites\nPriority support\nCustom domain',
        ctaText: 'Get Started',
        ctaUrl: '#',
        highlighted: true,
      },
    ],
  });

const faq = () =>
  component('FAQ', {
    heading: 'Frequently asked questions',
    items: [
      {
        question: 'Can I cancel any time?',
        answer: "Yes, there's no lock-in — cancel whenever you like.",
      },
      {
        question: 'Do you offer a free trial?',
        answer: 'Yes, every plan starts with a free trial.',
      },
    ],
  });

const cta = (overrides: Record<string, unknown> = {}) =>
  component('CTA', {
    heading: 'Ready to get started?',
    subheading: 'Create your first website in under a minute.',
    ctaText: 'Get Started',
    ctaUrl: '#',
    style: 'primary',
    ...overrides,
  });

const contactForm = () =>
  component('ContactForm', {
    heading: 'Get in touch',
    subheading: "Send a message and we'll get back to you shortly.",
    namePlaceholder: 'Your name',
    emailPlaceholder: 'you@example.com',
    messagePlaceholder: 'How can we help?',
    submitLabel: 'Send message',
  });

export function defaultContentForPageType(
  pageType: PageType | undefined,
): Record<string, unknown> {
  switch (pageType) {
    case 'home':
      return { content: [hero(), features(), testimonials(), cta()], root: {} };
    case 'about':
      return {
        content: [
          hero({
            eyebrow: 'About us',
            heading: 'The story behind the product',
            showSecondaryCta: false,
          }),
          features({
            heading: 'What we care about',
            subheading: 'The principles behind every decision we make.',
            items: [
              {
                icon: 'shield',
                title: 'Reliability first',
                description: 'We ship things that work, every time.',
              },
              {
                icon: 'star',
                title: 'Craft over speed',
                description: 'We would rather do it right than do it fast.',
              },
              {
                icon: 'bolt',
                title: 'Honest defaults',
                description: 'No dark patterns, no surprise behavior.',
              },
            ],
          }),
          cta({
            heading: 'Want to work with us?',
            subheading: 'Reach out — we would love to hear from you.',
          }),
        ],
        root: {},
      };
    case 'services':
      return {
        content: [
          hero({
            eyebrow: 'Services',
            heading: 'What we can do for you',
            showSecondaryCta: false,
          }),
          features(),
          cta(),
        ],
        root: {},
      };
    case 'pricing':
      return {
        content: [
          hero({
            eyebrow: 'Pricing',
            heading: 'Plans for every stage',
            showSecondaryCta: false,
          }),
          pricing(),
          faq(),
          cta(),
        ],
        root: {},
      };
    case 'contact':
      return {
        content: [
          hero({
            eyebrow: 'Contact',
            heading: "Let's talk",
            subheading: 'We usually reply within a day.',
            showSecondaryCta: false,
          }),
          contactForm(),
        ],
        root: {},
      };
    case 'blog':
      return {
        content: [
          hero({
            eyebrow: 'Blog',
            heading: 'Latest updates',
            showSecondaryCta: false,
          }),
        ],
        root: {},
      };
    case 'blank':
    default:
      return { content: [], root: {} };
  }
}
