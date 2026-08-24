"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Website } from "@/lib/websites";
import { timeAgo } from "@/lib/format";

const STATUS_LABEL: Record<Website["status"], string> = {
  DRAFT: "Draft",
  LIVE: "Live",
};

const STATUS_CLASSES: Record<Website["status"], string> = {
  DRAFT: "bg-surface-sunken text-muted-foreground border-border",
  LIVE: "bg-success-soft text-success border-success/20",
};

export function WebsiteCard({
  website,
  canManage,
  canDelete,
  onRename,
  onDuplicate,
  onArchive,
  onDelete,
}: {
  website: Website;
  canManage: boolean;
  canDelete: boolean;
  onRename: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
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
    <div className="group relative overflow-hidden rounded-xl border border-border bg-surface shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md">
      <Link href={`/dashboard/websites/${website.id}`} className="block">
        <div className="bg-dot-grid relative flex h-28 items-center justify-center bg-surface-sunken">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-foreground shadow-sm ring-1 ring-border transition-transform duration-150 group-hover:scale-105">
            <svg className="h-4.5 w-4.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
              <path strokeLinecap="round" d="M3.5 9h17" />
              <circle cx="6" cy="6.75" r="0.5" fill="currentColor" stroke="none" />
              <circle cx="8" cy="6.75" r="0.5" fill="currentColor" stroke="none" />
            </svg>
          </div>
        </div>

        <div className="p-4">
          <p className="truncate text-sm font-semibold text-foreground">{website.name}</p>
          <p className="truncate text-xs text-muted-foreground">{website.slug}</p>

          <div className="mt-3 flex items-center gap-1.5">
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[website.status]}`}
            >
              {STATUS_LABEL[website.status]}
            </span>
            <span className="rounded-full border border-border bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
              Not Deployed
            </span>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">Updated {timeAgo(website.updatedAt)}</p>
        </div>
      </Link>

      {canManage && (
        <div className="absolute right-3 top-3" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-md bg-surface/90 p-1 text-muted-foreground opacity-0 shadow-sm ring-1 ring-border backdrop-blur-sm transition-opacity hover:bg-surface hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
            aria-label="Website actions"
          >
            <svg className="h-4.5 w-4.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5A1.5 1.5 0 1110 11.5a1.5 1.5 0 010-3zM10 14A1.5 1.5 0 1110 17a1.5 1.5 0 010-3z" />
            </svg>
          </button>

          {menuOpen && (
            <div className="animate-menu absolute right-0 top-full z-10 mt-1.5 w-40 rounded-lg border border-border bg-surface py-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onRename();
                }}
                className="block w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-sunken"
              >
                Rename
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
                  onArchive();
                }}
                className="block w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-surface-sunken"
              >
                Archive
              </button>
              {canDelete && (
                <>
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
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
