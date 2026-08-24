import type { Config, Slot } from "@puckeditor/core";
import { GAP_MULTIPLIER, PADDING_Y_PX, SITE, spacing } from "./site-styles";

const SIZE_OPTIONS = [
  { label: "Small", value: "small" },
  { label: "Medium", value: "medium" },
  { label: "Large", value: "large" },
];

const ALIGN_OPTIONS = [
  { label: "Left", value: "left" },
  { label: "Center", value: "center" },
  { label: "Right", value: "right" },
];

export interface SectionProps {
  content: Slot;
  background: "none" | "surface" | "primary";
  paddingY: "small" | "medium" | "large";
  fullBleed: boolean;
}

export interface ContainerProps {
  content: Slot;
  maxWidth: "narrow" | "default" | "wide";
}

export interface ColumnsProps {
  columnA: Slot;
  columnB: Slot;
  columnC: Slot;
  ratio: "50/50" | "33/33/33" | "30/70" | "70/30";
  gap: "small" | "medium" | "large";
  stackOnMobile: boolean;
}

export interface GridProps {
  item1: Slot;
  item2: Slot;
  item3: Slot;
  item4: Slot;
  item5: Slot;
  item6: Slot;
  columns: "2" | "3" | "4";
  gap: "small" | "medium" | "large";
}

export interface StackProps {
  content: Slot;
  gap: "small" | "medium" | "large";
  align: "left" | "center" | "right";
}

export type LayoutComponents = {
  Section: SectionProps;
  Container: ContainerProps;
  Columns: ColumnsProps;
  Grid: GridProps;
  Stack: StackProps;
};

const MAX_WIDTH_PX: Record<ContainerProps["maxWidth"], string> = {
  narrow: "42rem",
  default: SITE.containerWidth,
  wide: "90rem",
};

const RATIO_TEMPLATE: Record<ColumnsProps["ratio"], string> = {
  "50/50": "1fr 1fr",
  "33/33/33": "1fr 1fr 1fr",
  "30/70": "3fr 7fr",
  "70/30": "7fr 3fr",
};

export const layoutFieldTabs = {
  Section: { content: ["content"], style: ["background", "paddingY", "fullBleed"] },
  Container: { content: ["content"], style: ["maxWidth"] },
  Columns: { content: ["columnA", "columnB", "columnC"], style: ["ratio", "gap", "stackOnMobile"] },
  Grid: {
    content: ["item1", "item2", "item3", "item4", "item5", "item6"],
    style: ["columns", "gap"],
  },
  Stack: { content: ["content"], style: ["gap", "align"] },
};

export const layoutComponents: Config<LayoutComponents>["components"] = {
  Section: {
    label: "Section",
    defaultProps: { content: [], background: "none", paddingY: "medium", fullBleed: false },
    fields: {
      content: { type: "slot" },
      background: {
        type: "select",
        label: "Background",
        options: [
          { label: "None", value: "none" },
          { label: "Surface tint", value: "surface" },
          { label: "Primary", value: "primary" },
        ],
      },
      paddingY: { type: "select", label: "Vertical padding", options: SIZE_OPTIONS },
      fullBleed: {
        type: "radio",
        label: "Full width",
        options: [
          { label: "Yes", value: true },
          { label: "No", value: false },
        ],
      },
    },
    render: ({ content: Content, background, paddingY, fullBleed }) => {
      const bg =
        background === "primary" ? SITE.primary : background === "surface" ? `color-mix(in srgb, ${SITE.primary} 6%, ${SITE.background})` : "transparent";
      const textColor = background === "primary" ? SITE.background : SITE.text;
      return (
        <section style={{ background: bg, color: textColor, paddingTop: spacing(PADDING_Y_PX[paddingY]), paddingBottom: spacing(PADDING_Y_PX[paddingY]) }}>
          <div style={{ maxWidth: fullBleed ? undefined : SITE.containerWidth, marginInline: fullBleed ? undefined : "auto", paddingInline: fullBleed ? undefined : spacing(4) }}>
            <Content />
          </div>
        </section>
      );
    },
  },
  Container: {
    label: "Container",
    defaultProps: { content: [], maxWidth: "default" },
    fields: {
      content: { type: "slot" },
      maxWidth: {
        type: "select",
        label: "Max width",
        options: [
          { label: "Narrow", value: "narrow" },
          { label: "Default", value: "default" },
          { label: "Wide", value: "wide" },
        ],
      },
    },
    render: ({ content: Content, maxWidth }) => (
      <div style={{ maxWidth: MAX_WIDTH_PX[maxWidth], marginInline: "auto", paddingInline: spacing(4) }}>
        <Content />
      </div>
    ),
  },
  Columns: {
    label: "Columns",
    defaultProps: { columnA: [], columnB: [], columnC: [], ratio: "50/50", gap: "medium", stackOnMobile: true },
    fields: {
      columnA: { type: "slot" },
      columnB: { type: "slot" },
      columnC: { type: "slot" },
      ratio: {
        type: "select",
        label: "Ratio",
        options: [
          { label: "50 / 50", value: "50/50" },
          { label: "33 / 33 / 33", value: "33/33/33" },
          { label: "30 / 70", value: "30/70" },
          { label: "70 / 30", value: "70/30" },
        ],
      },
      gap: { type: "select", label: "Gap", options: SIZE_OPTIONS },
      stackOnMobile: {
        type: "radio",
        label: "Stack on mobile",
        options: [
          { label: "Yes", value: true },
          { label: "No", value: false },
        ],
      },
    },
    render: ({ columnA: ColumnA, columnB: ColumnB, columnC: ColumnC, ratio, gap, stackOnMobile }) => {
      const columnCount = ratio === "33/33/33" ? 3 : 2;
      return (
        <div
          className={stackOnMobile ? "grid grid-cols-1 sm:[grid-template-columns:var(--cols)]" : "grid"}
          style={{ gap: spacing(GAP_MULTIPLIER[gap]), gridTemplateColumns: stackOnMobile ? undefined : RATIO_TEMPLATE[ratio], ["--cols" as string]: RATIO_TEMPLATE[ratio] }}
        >
          <div>
            <ColumnA />
          </div>
          <div>
            <ColumnB />
          </div>
          {columnCount === 3 && (
            <div>
              <ColumnC />
            </div>
          )}
        </div>
      );
    },
  },
  Grid: {
    label: "Grid",
    defaultProps: { item1: [], item2: [], item3: [], item4: [], item5: [], item6: [], columns: "3", gap: "medium" },
    fields: {
      item1: { type: "slot" },
      item2: { type: "slot" },
      item3: { type: "slot" },
      item4: { type: "slot" },
      item5: { type: "slot" },
      item6: { type: "slot" },
      columns: {
        type: "select",
        label: "Columns",
        options: [
          { label: "2", value: "2" },
          { label: "3", value: "3" },
          { label: "4", value: "4" },
        ],
      },
      gap: { type: "select", label: "Gap", options: SIZE_OPTIONS },
    },
    render: ({ item1: Item1, item2: Item2, item3: Item3, item4: Item4, item5: Item5, item6: Item6, columns, gap }) => (
      <div className="grid" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)`, gap: spacing(GAP_MULTIPLIER[gap]) }}>
        <div>
          <Item1 />
        </div>
        <div>
          <Item2 />
        </div>
        <div>
          <Item3 />
        </div>
        <div>
          <Item4 />
        </div>
        <div>
          <Item5 />
        </div>
        <div>
          <Item6 />
        </div>
      </div>
    ),
  },
  Stack: {
    label: "Stack",
    defaultProps: { content: [], gap: "medium", align: "left" },
    fields: {
      content: { type: "slot" },
      gap: { type: "select", label: "Gap", options: SIZE_OPTIONS },
      align: { type: "select", label: "Alignment", options: ALIGN_OPTIONS },
    },
    render: ({ content: Content, gap, align }) => (
      <div
        className="flex flex-col"
        style={{ gap: spacing(GAP_MULTIPLIER[gap]), alignItems: align === "left" ? "flex-start" : align === "right" ? "flex-end" : "center" }}
      >
        <Content />
      </div>
    ),
  },
};
