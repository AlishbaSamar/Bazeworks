"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Page, PageStatus } from "@/lib/pages";
import { timeAgo } from "@/lib/format";

const STATUS_LABEL: Record<PageStatus, string> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
};

const STATUS_CLASSES: Record<PageStatus, string> = {
  DRAFT: "bg-surface-sunken text-muted-foreground border-border",
  PUBLISHED: "bg-success-soft text-success border-success/20",
};

export function PageRow({
  page,
  editorHref,
  canManage,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onConfigureDynamic,
  onDelete,
}: {
  page: Page;
  editorHref: string;
  canManage: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onToggleStatus: () => void;
  onConfigureDynamic: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="group flex items-center gap-3 rounded-lg border border-border px-3.5 py-2.5 text-sm transition-colors hover:border-border-strong hover:bg-surface-sunken">
      <Link href={editorHref} className="flex min-w-0 flex-1 items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-surface-sunken text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <rect x="4" y="3" width="16" height="18" rx="2" />
            <path strokeLinecap="round" d="M8 8h8M8 12h8M8 16h5" />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="block truncate font-medium text-foreground">{page.name}</span>
            {page.isDynamic && (
              <span className="shrink-0 rounded-full border border-border bg-surface-sunken px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Dynamic
              </span>
            )}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {page.slug}
            {page.isDynamic && (page.slug === "/" ? "[slug]" : "/[slug]")}
          </span>
        </span>
      </Link>

      <span className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[page.status]}`}>
        {STATUS_LABEL[page.status]}
      </span>

      <span className="hidden shrink-0 text-xs text-muted-foreground sm:inline">Updated {timeAgo(page.updatedAt)}</span>

      {canManage && (
        <div className="relative shrink-0" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
            aria-label="Page actions"
          >
            <svg className="h-4.5 w-4.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5A1.5 1.5 0 1110 11.5a1.5 1.5 0 010-3zM10 14A1.5 1.5 0 1110 17a1.5 1.5 0 010-3z" />
            </svg>
          </button>

          {menuOpen && (
            <div className="animate-menu absolute right-0 top-full z-10 mt-1.5 w-44 rounded-lg border border-border bg-surface py-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit();
                }}
                className="block w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-sunken"
              >
                Edit name & slug
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDuplicate();
                }}
                className="block w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-sunken"
              >
                Duplicate
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onToggleStatus();
                }}
                className="block w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-sunken"
              >
                {page.status === "PUBLISHED" ? "Unpublish" : "Publish"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onConfigureDynamic();
                }}
                className="block w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-sunken"
              >
                Dynamic page…
              </button>
              <div className="my-1 h-px bg-border" />
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                className="block w-full px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive-soft"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
