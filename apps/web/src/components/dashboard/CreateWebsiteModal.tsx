"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { FormBanner } from "@/components/ui/FormBanner";
import { TemplateGallery } from "@/components/dashboard/TemplateGallery";
import { ApiError } from "@/lib/api-client";
import { websitesApi, type Website } from "@/lib/websites";
import type { Template } from "@/lib/templates";

type Step = "choose" | "gallery";

export function CreateWebsiteModal({
  workspaceId,
  onClose,
  onCreated,
}: {
  workspaceId: string;
  onClose: () => void;
  onCreated: (website: Website) => void;
}) {
  const [step, setStep] = useState<Step>("choose");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function create(data: { name: string; templateId?: string }) {
    setError(null);
    setLoading(true);
    try {
      const website = await websitesApi.create(workspaceId, data);
      onCreated(website);
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
            {step === "gallery" && (
              <button
                type="button"
                onClick={() => setStep("choose")}
                className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                disabled={loading}
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M17 10a.75.75 0 01-.75.75H5.56l3.72 3.72a.75.75 0 11-1.06 1.06l-5-5a.75.75 0 010-1.06l5-5a.75.75 0 111.06 1.06L5.56 9.25H16.25A.75.75 0 0117 10z"
                    clipRule="evenodd"
                  />
                </svg>
                Back
              </button>
            )}
            <h2 className="text-lg font-semibold text-foreground">Create website</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {step === "choose" ? "Choose a starting point" : "Choose a template to get started"}
            </p>
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

        <div className="mt-5">
          {step === "choose" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <button
                type="button"
                disabled={loading}
                onClick={() => create({ name: "Untitled Website" })}
                className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-background p-7 text-center shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-dashed border-border-strong text-muted-foreground transition-colors group-hover:border-foreground group-hover:text-foreground">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-foreground">Blank website</span>
                <span className="text-xs text-muted-foreground">
                  Start with a clean slate and build your site from scratch.
                </span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => setStep("gallery")}
                className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-background p-7 text-center shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-sm"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                  <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
                    <path strokeLinecap="round" d="M3.5 9.5h17M9.5 9.5V20.5" />
                  </svg>
                </div>
                <span className="text-sm font-semibold text-foreground">Use a template</span>
                <span className="text-xs text-muted-foreground">
                  Choose from a collection of professionally designed templates.
                </span>
              </button>
            </div>
          ) : (
            <TemplateGallery
              disabled={loading}
              workspaceId={workspaceId}
              onSelect={(template: Template) => create({ name: template.name, templateId: template.id })}
            />
          )}
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
