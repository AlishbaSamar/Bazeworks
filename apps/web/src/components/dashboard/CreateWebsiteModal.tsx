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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={loading ? undefined : onClose}
    >
      <div
        className="w-full max-w-2xl rounded-lg border border-border bg-surface p-6 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Create Website</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {step === "choose" ? "Choose a starting point" : "Choose a template to get started"}
            </p>
          </div>
          {step === "gallery" && (
            <button
              type="button"
              onClick={() => setStep("choose")}
              className="text-sm font-medium text-muted-foreground hover:text-foreground"
              disabled={loading}
            >
              ← Back
            </button>
          )}
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
                className="flex flex-col items-center gap-3 rounded-lg border border-border bg-background p-6 text-center transition-colors hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg className="h-8 w-8 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <rect x="4" y="4" width="16" height="16" rx="2" strokeDasharray="3 3" />
                </svg>
                <span className="text-sm font-semibold text-foreground">Blank Website</span>
                <span className="text-xs text-muted-foreground">
                  Start with a clean slate and build your site from scratch.
                </span>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => setStep("gallery")}
                className="flex flex-col items-center gap-3 rounded-lg border border-border bg-background p-6 text-center transition-colors hover:border-border-strong disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg className="h-8 w-8 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <rect x="3.5" y="3.5" width="17" height="17" rx="2" />
                  <path strokeLinecap="round" d="M3.5 9.5h17" />
                </svg>
                <span className="text-sm font-semibold text-foreground">Use Template</span>
                <span className="text-xs text-muted-foreground">
                  Choose from a collection of professionally designed templates.
                </span>
              </button>
            </div>
          ) : (
            <TemplateGallery
              disabled={loading}
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
