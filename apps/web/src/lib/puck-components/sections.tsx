import type { Config } from "@puckeditor/core";
import { SECTION_ICON_OPTIONS, SectionIcon, type SectionIconName } from "./section-icons";
import { SITE, bodyStyle, headingStyle, spacing } from "./site-styles";

const ALIGN_OPTIONS = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
];

interface NavLink {
  label: string;
  url: string;
}

export interface NavbarProps {
  logoText: string;
  links: NavLink[];
  ctaText: string;
  ctaUrl: string;
  showCta: boolean;
}

interface FooterLink {
  label: string;
  url: string;
}

export interface FooterProps {
  logoText: string;
  tagline: string;
  links: FooterLink[];
  copyrightText: string;
}

export interface HeroProps {
  eyebrow: string;
  heading: string;
  subheading: string;
  primaryCtaText: string;
  primaryCtaUrl: string;
  secondaryCtaText: string;
  secondaryCtaUrl: string;
  showSecondaryCta: boolean;
  align: "left" | "center";
}

interface FeatureItem {
  icon: SectionIconName;
  title: string;
  description: string;
}

export interface FeaturesProps {
  heading: string;
  subheading: string;
  items: FeatureItem[];
  columns: "2" | "3" | "4";
}

interface TestimonialItem {
  quote: string;
  authorName: string;
  authorRole: string;
}

export interface TestimonialsProps {
  heading: string;
  items: TestimonialItem[];
  columns: "1" | "2" | "3";
}

interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: string;
  ctaText: string;
  ctaUrl: string;
  highlighted: boolean;
}

export interface PricingProps {
  heading: string;
  subheading: string;
  tiers: PricingTier[];
}

interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqProps {
  heading: string;
  items: FaqItem[];
}

export interface CtaProps {
  heading: string;
  subheading: string;
  ctaText: string;
  ctaUrl: string;
  style: "primary" | "contrast";
}

export interface ContactFormProps {
  heading: string;
  subheading: string;
  namePlaceholder: string;
  emailPlaceholder: string;
  messagePlaceholder: string;
  submitLabel: string;
}

export type SectionComponents = {
  Navbar: NavbarProps;
  Footer: FooterProps;
  Hero: HeroProps;
  Features: FeaturesProps;
  Testimonials: TestimonialsProps;
  Pricing: PricingProps;
  FAQ: FaqProps;
  CTA: CtaProps;
  ContactForm: ContactFormProps;
};

export const sectionFieldTabs = {
  Navbar: { content: ["logoText", "links", "ctaText", "ctaUrl"], advanced: ["showCta"] },
  Footer: { content: ["logoText", "tagline", "links", "copyrightText"] },
  Hero: {
    content: ["eyebrow", "heading", "subheading", "primaryCtaText", "primaryCtaUrl", "secondaryCtaText", "secondaryCtaUrl"],
    style: ["align"],
    advanced: ["showSecondaryCta"],
  },
  Features: { content: ["heading", "subheading", "items"], style: ["columns"] },
  Testimonials: { content: ["heading", "items"], style: ["columns"] },
  Pricing: { content: ["heading", "subheading", "tiers"] },
  FAQ: { content: ["heading", "items"] },
  CTA: { content: ["heading", "subheading", "ctaText", "ctaUrl"], style: ["style"] },
  ContactForm: { content: ["heading", "subheading", "namePlaceholder", "emailPlaceholder", "messagePlaceholder", "submitLabel"] },
};

const cardStyle = {
  background: SITE.background,
  border: `1px solid ${SITE.border}`,
  borderRadius: SITE.radius,
};

const inputStyle = {
  ...bodyStyle,
  border: `1px solid ${SITE.border}`,
  borderRadius: SITE.radius,
  padding: `${spacing(2.5)} ${spacing(3)}`,
  width: "100%",
  background: SITE.background,
};

function PrimaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      style={{ background: SITE.primary, color: SITE.background, borderRadius: SITE.radius, fontFamily: SITE.fontBody, fontWeight: 600 }}
      className="inline-flex h-11 items-center justify-center px-5 text-sm transition-opacity hover:opacity-90"
    >
      {children}
    </a>
  );
}

function SecondaryButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      style={{ border: `1px solid ${SITE.border}`, color: SITE.text, borderRadius: SITE.radius, fontFamily: SITE.fontBody, fontWeight: 600 }}
      className="inline-flex h-11 items-center justify-center px-5 text-sm transition-colors"
    >
      {children}
    </a>
  );
}

export const sectionComponents: Config<SectionComponents>["components"] = {
  Navbar: {
    label: "Navbar",
    defaultProps: {
      logoText: "Brand",
      links: [
        { label: "Features", url: "#" },
        { label: "Pricing", url: "#" },
        { label: "About", url: "#" },
      ],
      ctaText: "Get Started",
      ctaUrl: "#",
      showCta: true,
    },
    fields: {
      logoText: { type: "text", label: "Logo text" },
      links: {
        type: "array",
        label: "Links",
        getItemSummary: (item: NavLink) => item.label || "Link",
        defaultItemProps: { label: "New link", url: "#" },
        arrayFields: {
          label: { type: "text", label: "Label" },
          url: { type: "text", label: "URL" },
        },
      },
      ctaText: { type: "text", label: "Button text" },
      ctaUrl: { type: "text", label: "Button URL" },
      showCta: {
        type: "radio",
        label: "Show button",
        options: [
          { label: "Yes", value: true },
          { label: "No", value: false },
        ],
      },
    },
    render: ({ logoText, links, ctaText, ctaUrl, showCta }: NavbarProps) => (
      <nav
        style={{ borderBottom: `1px solid ${SITE.border}`, background: SITE.background, paddingBlock: spacing(3), paddingInline: spacing(4) }}
        className="flex items-center justify-between"
      >
        <span style={{ ...headingStyle, fontSize: "1.125rem" }}>{logoText}</span>
        <div className="hidden items-center gap-6 sm:flex">
          {links.map((link, i) => (
            <a key={i} href={link.url} style={{ ...bodyStyle, fontSize: "0.875rem" }} className="hover:opacity-70">
              {link.label}
            </a>
          ))}
        </div>
        {showCta && <PrimaryButton href={ctaUrl}>{ctaText}</PrimaryButton>}
      </nav>
    ),
  },

  Footer: {
    label: "Footer",
    defaultProps: {
      logoText: "Brand",
      tagline: "Building something great.",
      links: [
        { label: "Privacy", url: "#" },
        { label: "Terms", url: "#" },
        { label: "Contact", url: "#" },
      ],
      copyrightText: `© ${new Date().getFullYear()} Brand. All rights reserved.`,
    },
    fields: {
      logoText: { type: "text", label: "Logo text" },
      tagline: { type: "text", label: "Tagline" },
      links: {
        type: "array",
        label: "Links",
        getItemSummary: (item: FooterLink) => item.label || "Link",
        defaultItemProps: { label: "New link", url: "#" },
        arrayFields: {
          label: { type: "text", label: "Label" },
          url: { type: "text", label: "URL" },
        },
      },
      copyrightText: { type: "text", label: "Copyright text" },
    },
    render: ({ logoText, tagline, links, copyrightText }: FooterProps) => (
      <footer style={{ borderTop: `1px solid ${SITE.border}`, background: SITE.background, paddingBlock: spacing(8), paddingInline: spacing(4) }}>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p style={{ ...headingStyle, fontSize: "1.125rem" }}>{logoText}</p>
            <p style={{ ...bodyStyle, fontSize: "0.875rem", opacity: 0.7 }} className="mt-1">
              {tagline}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {links.map((link, i) => (
              <a key={i} href={link.url} style={{ ...bodyStyle, fontSize: "0.875rem" }} className="hover:opacity-70">
                {link.label}
              </a>
            ))}
          </div>
        </div>
        <p style={{ ...bodyStyle, fontSize: "0.75rem", opacity: 0.6 }} className="mt-8">
          {copyrightText}
        </p>
      </footer>
    ),
  },

  Hero: {
    label: "Hero",
    defaultProps: {
      eyebrow: "New",
      heading: "Build faster with a clear, confident story",
      subheading: "A short, honest sentence about what this product does and who it's for.",
      primaryCtaText: "Get Started",
      primaryCtaUrl: "#",
      secondaryCtaText: "Learn more",
      secondaryCtaUrl: "#",
      showSecondaryCta: true,
      align: "center",
    },
    fields: {
      eyebrow: { type: "text", label: "Eyebrow" },
      heading: { type: "text", label: "Heading" },
      subheading: { type: "textarea", label: "Subheading" },
      primaryCtaText: { type: "text", label: "Primary button text" },
      primaryCtaUrl: { type: "text", label: "Primary button URL" },
      secondaryCtaText: { type: "text", label: "Secondary button text" },
      secondaryCtaUrl: { type: "text", label: "Secondary button URL" },
      showSecondaryCta: {
        type: "radio",
        label: "Show secondary button",
        options: [
          { label: "Yes", value: true },
          { label: "No", value: false },
        ],
      },
      align: { type: "select", label: "Alignment", options: ALIGN_OPTIONS },
    },
    render: ({ eyebrow, heading, subheading, primaryCtaText, primaryCtaUrl, secondaryCtaText, secondaryCtaUrl, showSecondaryCta, align }: HeroProps) => (
      <div style={{ textAlign: align, paddingBlock: spacing(12) }} className={align === "center" ? "mx-auto max-w-2xl" : "max-w-2xl"}>
        {eyebrow && (
          <span
            style={{ border: `1px solid ${SITE.border}`, color: SITE.text, borderRadius: "999px", fontFamily: SITE.fontBody }}
            className="inline-block px-3 py-1 text-xs font-medium"
          >
            {eyebrow}
          </span>
        )}
        <h1 style={{ ...headingStyle, fontSize: "2.5rem", lineHeight: 1.1 }} className="mt-4">
          {heading}
        </h1>
        <p style={{ ...bodyStyle, fontSize: "1.125rem", opacity: 0.75 }} className="mt-4">
          {subheading}
        </p>
        <div className={`mt-8 flex flex-wrap gap-3 ${align === "center" ? "justify-center" : ""}`}>
          <PrimaryButton href={primaryCtaUrl}>{primaryCtaText}</PrimaryButton>
          {showSecondaryCta && <SecondaryButton href={secondaryCtaUrl}>{secondaryCtaText}</SecondaryButton>}
        </div>
      </div>
    ),
  },

  Features: {
    label: "Features",
    defaultProps: {
      heading: "Everything you need",
      subheading: "A short line describing the value of these features together.",
      items: [
        { icon: "bolt", title: "Fast by default", description: "Every screen is optimized so nothing feels slow." },
        { icon: "shield", title: "Secure at the core", description: "Role-based access and safe defaults everywhere." },
        { icon: "rocket", title: "Ready to ship", description: "Go from idea to production without extra tooling." },
      ],
      columns: "3",
    },
    fields: {
      heading: { type: "text", label: "Heading" },
      subheading: { type: "textarea", label: "Subheading" },
      items: {
        type: "array",
        label: "Features",
        min: 1,
        max: 6,
        getItemSummary: (item: FeatureItem) => item.title || "Feature",
        defaultItemProps: { icon: "star", title: "New feature", description: "Describe the benefit here." },
        arrayFields: {
          icon: { type: "select", label: "Icon", options: SECTION_ICON_OPTIONS },
          title: { type: "text", label: "Title" },
          description: { type: "textarea", label: "Description" },
        },
      },
      columns: {
        type: "select",
        label: "Columns",
        options: [
          { label: "2", value: "2" },
          { label: "3", value: "3" },
          { label: "4", value: "4" },
        ],
      },
    },
    render: ({ heading, subheading, items, columns }: FeaturesProps) => (
      <div style={{ paddingBlock: spacing(10) }}>
        <div className="max-w-xl">
          <h2 style={{ ...headingStyle, fontSize: "1.875rem" }}>{heading}</h2>
          <p style={{ ...bodyStyle, opacity: 0.75 }} className="mt-2">
            {subheading}
          </p>
        </div>
        <div className="mt-8 grid gap-6" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {items.map((item, i) => (
            <div key={i}>
              <div
                style={{ background: SITE.primary, color: SITE.background, borderRadius: SITE.radius }}
                className="flex h-10 w-10 items-center justify-center"
              >
                <SectionIcon name={item.icon} className="h-5 w-5" />
              </div>
              <p style={{ ...headingStyle, fontSize: "1rem" }} className="mt-4">
                {item.title}
              </p>
              <p style={{ ...bodyStyle, fontSize: "0.875rem", opacity: 0.75 }} className="mt-1.5">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  Testimonials: {
    label: "Testimonials",
    defaultProps: {
      heading: "What people are saying",
      items: [
        { quote: "This completely changed how our team ships.", authorName: "Jamie Rivera", authorRole: "Head of Product" },
        { quote: "Setup took minutes, not weeks.", authorName: "Alex Chen", authorRole: "Founder" },
      ],
      columns: "2",
    },
    fields: {
      heading: { type: "text", label: "Heading" },
      items: {
        type: "array",
        label: "Testimonials",
        min: 1,
        max: 6,
        getItemSummary: (item: TestimonialItem) => item.authorName || "Testimonial",
        defaultItemProps: { quote: "Add a quote here.", authorName: "Name", authorRole: "Role" },
        arrayFields: {
          quote: { type: "textarea", label: "Quote" },
          authorName: { type: "text", label: "Author name" },
          authorRole: { type: "text", label: "Author role" },
        },
      },
      columns: {
        type: "select",
        label: "Columns",
        options: [
          { label: "1", value: "1" },
          { label: "2", value: "2" },
          { label: "3", value: "3" },
        ],
      },
    },
    render: ({ heading, items, columns }: TestimonialsProps) => (
      <div style={{ paddingBlock: spacing(10) }}>
        <h2 style={{ ...headingStyle, fontSize: "1.875rem" }}>{heading}</h2>
        <div className="mt-8 grid gap-6" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {items.map((item, i) => (
            <div key={i} style={{ ...cardStyle, padding: spacing(6) }}>
              <p style={{ ...bodyStyle, fontSize: "1rem" }}>&ldquo;{item.quote}&rdquo;</p>
              <p style={{ ...headingStyle, fontSize: "0.875rem" }} className="mt-4">
                {item.authorName}
              </p>
              <p style={{ ...bodyStyle, fontSize: "0.8125rem", opacity: 0.65 }}>{item.authorRole}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  Pricing: {
    label: "Pricing",
    defaultProps: {
      heading: "Simple, transparent pricing",
      subheading: "Pick the plan that fits, upgrade any time.",
      tiers: [
        { name: "Starter", price: "$0", description: "For getting started", features: "1 website\nBasic support", ctaText: "Get Started", ctaUrl: "#", highlighted: false },
        { name: "Pro", price: "$29/mo", description: "For growing teams", features: "Unlimited websites\nPriority support\nCustom domain", ctaText: "Get Started", ctaUrl: "#", highlighted: true },
      ],
    },
    fields: {
      heading: { type: "text", label: "Heading" },
      subheading: { type: "textarea", label: "Subheading" },
      tiers: {
        type: "array",
        label: "Pricing tiers",
        min: 1,
        max: 4,
        getItemSummary: (item: PricingTier) => item.name || "Tier",
        defaultItemProps: { name: "New plan", price: "$0", description: "Plan description", features: "Feature one\nFeature two", ctaText: "Get Started", ctaUrl: "#", highlighted: false },
        arrayFields: {
          name: { type: "text", label: "Name" },
          price: { type: "text", label: "Price" },
          description: { type: "text", label: "Description" },
          features: { type: "textarea", label: "Features (one per line)" },
          ctaText: { type: "text", label: "Button text" },
          ctaUrl: { type: "text", label: "Button URL" },
          highlighted: {
            type: "radio",
            label: "Highlighted",
            options: [
              { label: "Yes", value: true },
              { label: "No", value: false },
            ],
          },
        },
      },
    },
    render: ({ heading, subheading, tiers }: PricingProps) => (
      <div style={{ paddingBlock: spacing(10) }}>
        <div className="max-w-xl">
          <h2 style={{ ...headingStyle, fontSize: "1.875rem" }}>{heading}</h2>
          <p style={{ ...bodyStyle, opacity: 0.75 }} className="mt-2">
            {subheading}
          </p>
        </div>
        <div className="mt-8 grid gap-6" style={{ gridTemplateColumns: `repeat(${Math.min(tiers.length, 4)}, 1fr)` }}>
          {tiers.map((tier, i) => (
            <div
              key={i}
              style={{
                ...cardStyle,
                padding: spacing(6),
                border: tier.highlighted ? `2px solid ${SITE.primary}` : cardStyle.border,
              }}
            >
              <p style={{ ...headingStyle, fontSize: "1.125rem" }}>{tier.name}</p>
              <p style={{ ...headingStyle, fontSize: "2rem" }} className="mt-2">
                {tier.price}
              </p>
              <p style={{ ...bodyStyle, fontSize: "0.875rem", opacity: 0.7 }} className="mt-1">
                {tier.description}
              </p>
              <ul className="mt-4 flex flex-col gap-2">
                {tier.features
                  .split("\n")
                  .map((f) => f.trim())
                  .filter(Boolean)
                  .map((feature, fi) => (
                    <li key={fi} style={{ ...bodyStyle, fontSize: "0.875rem" }} className="flex items-center gap-2">
                      <SectionIcon name="check" className="h-4 w-4 shrink-0" />
                      {feature}
                    </li>
                  ))}
              </ul>
              <div className="mt-6">
                {tier.highlighted ? <PrimaryButton href={tier.ctaUrl}>{tier.ctaText}</PrimaryButton> : <SecondaryButton href={tier.ctaUrl}>{tier.ctaText}</SecondaryButton>}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
  },

  FAQ: {
    label: "FAQ",
    defaultProps: {
      heading: "Frequently asked questions",
      items: [
        { question: "Can I cancel any time?", answer: "Yes, there's no lock-in — cancel whenever you like." },
        { question: "Do you offer a free trial?", answer: "Yes, every plan starts with a free trial." },
      ],
    },
    fields: {
      heading: { type: "text", label: "Heading" },
      items: {
        type: "array",
        label: "Questions",
        min: 1,
        max: 10,
        getItemSummary: (item: FaqItem) => item.question || "Question",
        defaultItemProps: { question: "New question", answer: "Answer goes here." },
        arrayFields: {
          question: { type: "text", label: "Question" },
          answer: { type: "textarea", label: "Answer" },
        },
      },
    },
    render: ({ heading, items }: FaqProps) => (
      <div style={{ paddingBlock: spacing(10) }} className="max-w-2xl">
        <h2 style={{ ...headingStyle, fontSize: "1.875rem" }}>{heading}</h2>
        <div className="mt-6 flex flex-col">
          {items.map((item, i) => (
            <details key={i} style={{ borderBottom: `1px solid ${SITE.border}`, paddingBlock: spacing(4) }}>
              <summary style={{ ...headingStyle, fontSize: "1rem" }} className="cursor-pointer list-none">
                {item.question}
              </summary>
              <p style={{ ...bodyStyle, fontSize: "0.9375rem", opacity: 0.75 }} className="mt-2">
                {item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    ),
  },

  CTA: {
    label: "CTA",
    defaultProps: {
      heading: "Ready to get started?",
      subheading: "Create your first website in under a minute.",
      ctaText: "Get Started",
      ctaUrl: "#",
      style: "primary",
    },
    fields: {
      heading: { type: "text", label: "Heading" },
      subheading: { type: "textarea", label: "Subheading" },
      ctaText: { type: "text", label: "Button text" },
      ctaUrl: { type: "text", label: "Button URL" },
      style: {
        type: "select",
        label: "Style",
        options: [
          { label: "Primary", value: "primary" },
          { label: "Contrast", value: "contrast" },
        ],
      },
    },
    render: ({ heading, subheading, ctaText, ctaUrl, style }: CtaProps) => {
      const isContrast = style === "contrast";
      return (
        <div
          style={{
            background: isContrast ? SITE.primary : `color-mix(in srgb, ${SITE.primary} 6%, ${SITE.background})`,
            color: isContrast ? SITE.background : SITE.text,
            borderRadius: SITE.radius,
            padding: spacing(10),
          }}
          className="text-center"
        >
          <h2 style={{ ...headingStyle, fontSize: "1.875rem", color: "inherit" }}>{heading}</h2>
          <p style={{ ...bodyStyle, color: "inherit", opacity: 0.85 }} className="mx-auto mt-2 max-w-md">
            {subheading}
          </p>
          <div className="mt-6">
            {isContrast ? (
              <a
                href={ctaUrl}
                style={{ background: SITE.background, color: SITE.primary, borderRadius: SITE.radius, fontFamily: SITE.fontBody, fontWeight: 600 }}
                className="inline-flex h-11 items-center justify-center px-5 text-sm"
              >
                {ctaText}
              </a>
            ) : (
              <PrimaryButton href={ctaUrl}>{ctaText}</PrimaryButton>
            )}
          </div>
        </div>
      );
    },
  },

  ContactForm: {
    label: "Contact form",
    defaultProps: {
      heading: "Get in touch",
      subheading: "Send a message and we'll get back to you shortly.",
      namePlaceholder: "Your name",
      emailPlaceholder: "you@example.com",
      messagePlaceholder: "How can we help?",
      submitLabel: "Send message",
    },
    fields: {
      heading: { type: "text", label: "Heading" },
      subheading: { type: "textarea", label: "Subheading" },
      namePlaceholder: { type: "text", label: "Name placeholder" },
      emailPlaceholder: { type: "text", label: "Email placeholder" },
      messagePlaceholder: { type: "text", label: "Message placeholder" },
      submitLabel: { type: "text", label: "Submit button text" },
    },
    render: ({ heading, subheading, namePlaceholder, emailPlaceholder, messagePlaceholder, submitLabel }: ContactFormProps) => (
      <div style={{ paddingBlock: spacing(10) }} className="max-w-lg">
        <h2 style={{ ...headingStyle, fontSize: "1.875rem" }}>{heading}</h2>
        <p style={{ ...bodyStyle, opacity: 0.75 }} className="mt-2">
          {subheading}
        </p>
        <div className="mt-6 flex flex-col gap-4">
          <input type="text" placeholder={namePlaceholder} style={inputStyle} readOnly />
          <input type="email" placeholder={emailPlaceholder} style={inputStyle} readOnly />
          <textarea placeholder={messagePlaceholder} rows={4} style={inputStyle} readOnly />
          <button
            type="button"
            style={{ background: SITE.primary, color: SITE.background, borderRadius: SITE.radius, fontFamily: SITE.fontBody, fontWeight: 600 }}
            className="inline-flex h-11 items-center justify-center px-5 text-sm"
          >
            {submitLabel}
          </button>
        </div>
      </div>
    ),
  },
};
