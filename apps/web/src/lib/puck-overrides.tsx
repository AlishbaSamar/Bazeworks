"use client";

import { useState } from "react";
import type { Config, Field } from "@puckeditor/core";
import { AutoField, Drawer, usePuck } from "@puckeditor/core";
import { FIELD_TABS, type FieldTab, type PuckComponents } from "./puck-config";

type PuckConfig = Config<PuckComponents>;

const TAB_LABELS: Record<FieldTab, string> = {
  content: "Content",
  style: "Style",
  advanced: "Advanced",
};

const TAB_ORDER: FieldTab[] = ["content", "style", "advanced"];

function SearchIcon() {
  return (
    <svg className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.45 4.39l3.58 3.58a.75.75 0 11-1.06 1.06l-3.58-3.58A7 7 0 012 9z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/**
 * Replaces Puck's default component drawer with a searchable one. Puck's own
 * `ComponentList`/`ComponentList.Item` (the default renderer for this slot)
 * is a thin wrapper over the same `Drawer`/`Drawer.Item` primitives used
 * here, so drag-to-insert and insert permissions behave identically — this
 * only adds filtering on top.
 */
export function SearchableDrawer() {
  const { config, getPermissions } = usePuck<PuckConfig>();
  const [search, setSearch] = useState("");

  const term = search.trim().toLowerCase();
  const categories = config.categories ?? {};

  const groups = Object.entries(categories)
    .map(([key, category]) => {
      const names = category?.components ?? [];
      const matches = names.filter((name) => {
        if (!term) return true;
        const label = (config.components[name]?.["label"] as string | undefined) ?? name;
        return name.toLowerCase().includes(term) || label.toLowerCase().includes(term);
      });
      return { key, title: category?.title ?? key, matches };
    })
    .filter((group) => group.matches.length > 0);

  return (
    <div className="flex flex-col gap-3 p-3">
      <div className="relative">
        <SearchIcon />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search components…"
          className="h-9 w-full rounded-md border border-border bg-white pl-8 pr-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {groups.length === 0 && (
        <p className="px-1 py-4 text-center text-sm text-muted-foreground">
          No components match &ldquo;{search}&rdquo;.
        </p>
      )}

      {groups.map((group) => (
        <div key={group.key} className="flex flex-col gap-1.5">
          <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {group.title}
          </p>
          <Drawer>
            {group.matches.map((name) => {
              const label = (config.components[name]?.["label"] as string | undefined) ?? name;
              const canInsert = getPermissions({ type: name }).insert;
              return <Drawer.Item key={name} name={name} label={label} isDragDisabled={!canInsert} />;
            })}
          </Drawer>
        </div>
      ))}
    </div>
  );
}

/**
 * Groups a selected component's fields into Content / Style / Advanced tabs
 * per FIELD_TABS. Falls back to Puck's default flat field list (`children`)
 * whenever nothing is selected or the selected type has no tab mapping, so
 * root/page-level fields are untouched.
 *
 * Field updates dispatch the same `replace` action Puck's own field
 * resolution uses internally (see resolveAndReplaceData in @puckeditor/core)
 * — resolve the component's current zone/index via getSelectorForId, then
 * replace its data with the changed prop.
 */
export function TabbedFields({ children, isLoading }: { children: React.ReactNode; isLoading: boolean }) {
  const { selectedItem, config, dispatch, getSelectorForId } = usePuck<PuckConfig>();

  const componentType = selectedItem?.type;
  const tabConfig = componentType ? FIELD_TABS[componentType as keyof typeof FIELD_TABS] : undefined;
  const selectedId = selectedItem?.props.id;

  const availableTabs = tabConfig
    ? TAB_ORDER.filter((tab) => (tabConfig[tab]?.length ?? 0) > 0)
    : [];

  // Tracks the requested tab alongside which selection it applies to, so
  // switching to a different component resets to that component's first tab
  // without needing an effect to reconcile stale state.
  const [requestedTab, setRequestedTab] = useState<{ id?: string; tab: FieldTab }>({ tab: "content" });
  const activeTab =
    requestedTab.id === selectedId && availableTabs.includes(requestedTab.tab)
      ? requestedTab.tab
      : (availableTabs[0] ?? "content");

  if (!selectedItem || !tabConfig || !componentType) {
    return <>{children}</>;
  }

  const componentConfig = config.components[componentType];
  // FIELD_TABS is hand-authored against each component's real prop keys, but
  // TS can't narrow `fields` to one union member from a runtime string key.
  const fields = componentConfig?.fields as Record<string, Field> | undefined;
  const fieldKeys = tabConfig[activeTab] ?? [];

  function handleChange(key: string, value: unknown) {
    if (!selectedItem) return;
    const selector = getSelectorForId(selectedItem.props.id);
    if (!selector) return;
    dispatch({
      type: "replace",
      data: { ...selectedItem, props: { ...selectedItem.props, [key]: value } },
      destinationIndex: selector.index,
      destinationZone: selector.zone,
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {availableTabs.length > 1 && (
        <div className="flex items-center gap-1 border-b border-border">
          {availableTabs.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setRequestedTab({ id: selectedId, tab })}
              className={`relative px-3 py-2 text-sm font-medium transition-colors ${
                activeTab === tab ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {TAB_LABELS[tab]}
              {activeTab === tab && <span className="absolute inset-x-0 -bottom-px h-0.5 bg-foreground" />}
            </button>
          ))}
        </div>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="flex flex-col gap-4">
          {fieldKeys.map((key) => {
            const field = fields?.[key];
            if (!field) return null;
            return (
              <AutoField
                key={key}
                field={field}
                value={(selectedItem.props as Record<string, unknown>)[key]}
                onChange={(value) => handleChange(key, value)}
                id={`field-${key}`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
