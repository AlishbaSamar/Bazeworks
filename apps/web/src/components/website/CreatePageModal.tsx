"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormBanner } from "@/components/ui/FormBanner";
import { ApiError } from "@/lib/api-client";
import { pagesApi, type Page, type PageType } from "@/lib/pages";

const PAGE_TYPE_OPTIONS: { type: PageType; label: string; description: string }[] = [
  { type: "blank", label: "Blank", description: "An empty canvas to build from scratch." },
  { type: "home", label: "Home", description: "Hero, features, testimonials, and a closing CTA." },
  { type: "about", label: "About", description: "Hero, values grid, and a contact CTA." },
  { type: "services", label: "Services", description: "Hero, feature grid, and a closing CTA." },
  { type: "pricing", label: "Pricing", description: "Hero, pricing tiers, FAQ, and a CTA." },
  { type: "contact", label: "Contact", description: "Hero and a contact form." },
  { type: "blog", label: "Blog", description: "A starting point for your blog index." },
];

function PageTypeIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path strokeLinecap="round" d="M8 8h8M8 12h8M8 16h5" />
    </svg>
  );
}

export function CreatePageModal({
  workspaceId,
  websiteId,
  onClose,
  onCreated,
}: {
  workspaceId: string;
  websiteId: string;
  onClose: () => void;
  onCreated: (page: Page) => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function create(type: PageType, label: string) {
    setError(null);
    setLoading(true);
    try {
      const page = await pagesApi.create(workspaceId, websiteId, {
        name: label,
        pageType: type,
      });
      onCreated(page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div
      className="animate-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      onClick={loading ? undefined : onClose}
    >
      <div
        className="animate-modal w-full max-w-2xl rounded-xl border border-border bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Create page</h2>
            <p className="mt-1 text-sm text-muted-foreground">Choose a starting point for the new page.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-surface-sunken hover:text-foreground"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mt-4">
            <FormBanner variant="error">{error}</FormBanner>
          </div>
        )}

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {PAGE_TYPE_OPTIONS.map((option) => (
            <button
              key={option.type}
              type="button"
              disabled={loading}
              onClick={() => create(option.type, option.label)}
              className="group flex items-start gap-3 rounded-xl border border-border bg-background p-4 text-left shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-sunken text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <PageTypeIcon />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{option.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{option.description}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-5 flex justify-end">
          <Button type="button" variant="secondary" className="w-auto px-4" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
