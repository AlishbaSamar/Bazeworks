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
  DRAFT: "bg-background text-muted-foreground border-border",
  LIVE: "bg-success/10 text-success border-success/20",
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
    <div className="group relative rounded-lg border border-border bg-surface p-5 transition-colors hover:border-border-strong">
      <Link href={`/dashboard/websites/${website.id}`} className="block">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{website.name}</p>
            <p className="truncate text-xs text-muted-foreground">{website.slug}</p>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
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
      </Link>

      {canManage && (
        <div className="absolute right-3 top-3" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-background hover:text-foreground focus-visible:opacity-100 group-hover:opacity-100"
            aria-label="Website actions"
          >
            <svg className="h-4.5 w-4.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5A1.5 1.5 0 1110 11.5a1.5 1.5 0 010-3zM10 14A1.5 1.5 0 1110 17a1.5 1.5 0 010-3z" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-40 rounded-md border border-border bg-surface py-1 shadow-lg">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onRename();
                }}
                className="block w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-background"
              >
                Rename
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDuplicate();
                }}
                className="block w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-background"
              >
                Duplicate
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onArchive();
                }}
                className="block w-full px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-background"
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
                    className="block w-full px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/5"
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
