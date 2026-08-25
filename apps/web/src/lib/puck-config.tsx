import type { Config } from "@puckeditor/core";
import { layoutComponents, layoutFieldTabs, type LayoutComponents } from "./puck-components/layout";
import { sectionComponents, sectionFieldTabs, type SectionComponents } from "./puck-components/sections";
import { GlobalHeaderFooterWrapper } from "./global-components-panel";

const ALIGN_OPTIONS = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
];

const YES_NO_OPTIONS = [
  { label: "Yes", value: true },
  { label: "No", value: false },
];

interface TextProps {
  content: string;
  align: "left" | "center" | "right";
}

interface HeadingProps {
  text: string;
  level: "1" | "2" | "3" | "4" | "5" | "6";
  align: "left" | "center" | "right";
}

interface ButtonProps {
  text: string;
  url: string;
  variant: "primary" | "secondary";
  size: "small" | "medium" | "large";
  align: "left" | "center" | "right";
  icon: "none" | "arrow" | "check" | "star";
  newTab: boolean;
}

interface ImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  objectFit: "cover" | "contain" | "fill";
  link: string;
}

interface LinkProps {
  text: string;
  url: string;
  newTab: boolean;
}

interface DividerProps {
  spacing: "small" | "medium" | "large";
}

interface SpacerProps {
  height: number;
}

export type PuckComponents = {
  Text: TextProps;
  Heading: HeadingProps;
  Button: ButtonProps;
  Image: ImageProps;
  Link: LinkProps;
  Divider: DividerProps;
  Spacer: SpacerProps;
} & LayoutComponents &
  SectionComponents;

const SPACING_PX: Record<DividerProps["spacing"], number> = {
  small: 12,
  medium: 24,
  large: 48,
};

const BUTTON_SIZE_CLASSES: Record<ButtonProps["size"], string> = {
  small: "h-8 px-3 text-xs",
  medium: "h-11 px-4 text-sm",
  large: "h-13 px-6 text-base",
};

const ICONS: Record<Exclude<ButtonProps["icon"], "none">, string> = {
  arrow: "→",
  check: "✓",
  star: "★",
};

export type FieldTab = "content" | "style" | "advanced";

/**
 * Which properties panel tab each component's fields belong to. Components
 * not listed here (or fields omitted from every tab) fall back to the
 * default flat field list — see the `fields` override in puck-overrides.tsx.
 */
export const FIELD_TABS: Partial<Record<keyof PuckComponents, Partial<Record<FieldTab, string[]>>>> = {
  Text: { content: ["content"], style: ["align"] },
  Heading: { content: ["text", "level"], style: ["align"] },
  Button: {
    content: ["text", "url"],
    style: ["variant", "size", "align", "icon"],
    advanced: ["newTab"],
  },
  Image: { content: ["src", "alt", "link"], style: ["width", "height", "objectFit"] },
  Link: { content: ["text", "url"], advanced: ["newTab"] },
  Divider: { style: ["spacing"] },
  Spacer: { style: ["height"] },
  ...layoutFieldTabs,
  ...sectionFieldTabs,
};

export const puckConfig: Config<PuckComponents> = {
  categories: {
    basic: {
      title: "Basic",
      components: ["Text", "Heading", "Button", "Image", "Link", "Divider", "Spacer"],
    },
    layout: {
      title: "Layout",
      components: ["Section", "Container", "Columns", "Grid", "Stack"],
    },
    sections: {
      title: "Website Sections",
      components: ["Navbar", "Footer", "Hero", "Features", "Testimonials", "Pricing", "FAQ", "CTA", "ContactForm"],
    },
  },
  components: {
    Text: {
      label: "Text",
      defaultProps: { content: "Text block", align: "left" },
      fields: {
        content: { type: "textarea", label: "Content" },
        align: { type: "select", label: "Alignment", options: ALIGN_OPTIONS },
      },
      render: ({ content, align }: TextProps) => (
        <p style={{ textAlign: align }} className="text-base text-foreground">
          {content}
        </p>
      ),
    },
    Heading: {
      label: "Heading",
      defaultProps: { text: "Heading", level: "2", align: "left" },
      fields: {
        text: { type: "text", label: "Text" },
        level: {
          type: "select",
          label: "Level",
          options: [1, 2, 3, 4, 5, 6].map((n) => ({ label: `H${n}`, value: String(n) })),
        },
        align: { type: "select", label: "Alignment", options: ALIGN_OPTIONS },
      },
      render: ({ text, level, align }: HeadingProps) => {
        const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
        const sizeClass =
          {
            "1": "text-4xl",
            "2": "text-3xl",
            "3": "text-2xl",
            "4": "text-xl",
            "5": "text-lg",
            "6": "text-base",
          }[level] ?? "text-2xl";
        return (
          <Tag style={{ textAlign: align }} className={`${sizeClass} font-semibold text-foreground`}>
            {text}
          </Tag>
        );
      },
    },
    Button: {
      label: "Button",
      defaultProps: {
        text: "Click me",
        url: "#",
        variant: "primary",
        size: "medium",
        align: "left",
        icon: "none",
        newTab: false,
      },
      fields: {
        text: { type: "text", label: "Text" },
        url: { type: "text", label: "URL" },
        variant: {
          type: "select",
          label: "Variant",
          options: [
            { label: "Primary", value: "primary" },
            { label: "Secondary", value: "secondary" },
          ],
        },
        size: {
          type: "select",
          label: "Size",
          options: [
            { label: "Small", value: "small" },
            { label: "Medium", value: "medium" },
            { label: "Large", value: "large" },
          ],
        },
        align: { type: "select", label: "Alignment", options: ALIGN_OPTIONS },
        icon: {
          type: "select",
          label: "Icon",
          options: [
            { label: "None", value: "none" },
            { label: "Arrow", value: "arrow" },
            { label: "Check", value: "check" },
            { label: "Star", value: "star" },
          ],
        },
        newTab: { type: "radio", label: "Open in new tab", options: YES_NO_OPTIONS },
      },
      render: ({ text, url, variant, size, align, icon, newTab }: ButtonProps) => (
        <div style={{ textAlign: align }}>
          <a
            href={url}
            target={newTab ? "_blank" : undefined}
            rel={newTab ? "noopener noreferrer" : undefined}
            className={`inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors ${BUTTON_SIZE_CLASSES[size]} ${
              variant === "primary"
                ? "bg-primary text-primary-foreground hover:bg-primary-hover"
                : "border border-border bg-white text-foreground hover:bg-background"
            }`}
          >
            {icon !== "none" && <span aria-hidden="true">{ICONS[icon]}</span>}
            {text}
          </a>
        </div>
      ),
    },
    Image: {
      label: "Image",
      defaultProps: {
        src: "",
        alt: "",
        width: 640,
        height: 360,
        objectFit: "cover",
        link: "",
      },
      fields: {
        src: { type: "text", label: "Image URL" },
        alt: { type: "text", label: "Alt text" },
        width: { type: "number", label: "Width (px)" },
        height: { type: "number", label: "Height (px)" },
        objectFit: {
          type: "select",
          label: "Object fit",
          options: [
            { label: "Cover", value: "cover" },
            { label: "Contain", value: "contain" },
            { label: "Fill", value: "fill" },
          ],
        },
        link: { type: "text", label: "Link (optional)" },
      },
      render: ({ src, alt, width, height, objectFit, link }: ImageProps) => {
        const img = src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            width={width}
            height={height}
            style={{ objectFit, maxWidth: "100%" }}
          />
        ) : (
          <div
            style={{ width, maxWidth: "100%", height }}
            className="flex items-center justify-center rounded-md border border-dashed border-border-strong bg-background text-sm text-muted-foreground"
          >
            No image set
          </div>
        );
        return link ? <a href={link}>{img}</a> : img;
      },
    },
    Link: {
      label: "Link",
      defaultProps: { text: "Link text", url: "#", newTab: false },
      fields: {
        text: { type: "text", label: "Text" },
        url: { type: "text", label: "URL" },
        newTab: { type: "radio", label: "Open in new tab", options: YES_NO_OPTIONS },
      },
      render: ({ text, url, newTab }: LinkProps) => (
        <a
          href={url}
          target={newTab ? "_blank" : undefined}
          rel={newTab ? "noopener noreferrer" : undefined}
          className="font-medium text-foreground underline underline-offset-2"
        >
          {text}
        </a>
      ),
    },
    Divider: {
      label: "Divider",
      defaultProps: { spacing: "medium" },
      fields: {
        spacing: {
          type: "select",
          label: "Spacing",
          options: [
            { label: "Small", value: "small" },
            { label: "Medium", value: "medium" },
            { label: "Large", value: "large" },
          ],
        },
      },
      render: ({ spacing }: DividerProps) => (
        <hr style={{ marginTop: SPACING_PX[spacing], marginBottom: SPACING_PX[spacing] }} className="border-border" />
      ),
    },
    Spacer: {
      label: "Spacer",
      defaultProps: { height: 40 },
      fields: {
        height: { type: "number", label: "Height (px)" },
      },
      render: ({ height }: SpacerProps) => <div style={{ height }} />,
    },
    ...layoutComponents,
    ...sectionComponents,
  },
  root: {
    render: ({ children }) => <GlobalHeaderFooterWrapper>{children}</GlobalHeaderFooterWrapper>,
  },
};
