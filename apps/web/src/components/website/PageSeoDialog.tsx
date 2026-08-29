"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormBanner } from "@/components/ui/FormBanner";
import { OgPreviewCard } from "@/components/website/OgPreviewCard";
import { ApiError } from "@/lib/api-client";
import { ROBOTS_OPTIONS, type PageSeo } from "@/lib/pages";

export function PageSeoDialog({
  pageName,
  pageSlug,
  siteBaseUrl,
  initialSeo,
  websiteRobotsDefault,
  onClose,
  onSave,
}: {
  pageName: string;
  pageSlug: string;
  siteBaseUrl: string;
  initialSeo: PageSeo;
  websiteRobotsDefault?: string;
  onClose: () => void;
  onSave: (seo: PageSeo) => Promise<void>;
}) {
  const [seo, setSeo] = useState<PageSeo>(initialSeo);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function set<K extends keyof PageSeo>(key: K, value: PageSeo[K]) {
    setSeo((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await onSave(seo);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save SEO settings.");
      setLoading(false);
    }
  }

  const pageUrl = `${siteBaseUrl.replace(/\/+$/, "")}${pageSlug === "/" ? "" : pageSlug}`;

  return (
    <div
      className="animate-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-modal flex max-h-[88vh] w-full max-w-3xl overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit} className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-lg font-semibold text-foreground">SEO — {pageName}</h2>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-5">
            {error && <FormBanner variant="error">{error}</FormBanner>}

            <Input
              label="SEO title"
              placeholder={pageName}
              value={seo.title ?? ""}
              onChange={(e) => set("title", e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Meta description</label>
              <textarea
                rows={2}
                value={seo.description ?? ""}
                onChange={(e) => set("description", e.target.value)}
                className="rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Input
              label="Canonical URL"
              placeholder={pageUrl}
              value={seo.canonicalUrl ?? ""}
              onChange={(e) => set("canonicalUrl", e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">Robots</label>
              <select
                value={seo.robots ?? ""}
                onChange={(e) => set("robots", (e.target.value || undefined) as PageSeo["robots"])}
                className="h-11 rounded-md border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">
                  Use site default{websiteRobotsDefault ? ` (${websiteRobotsDefault})` : ""}
                </option>
                {ROBOTS_OPTIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <div className="h-px bg-border" />
            <p className="text-sm font-medium text-foreground">Social sharing (Open Graph)</p>
            <Input
              label="OG title"
              placeholder={seo.title || pageName}
              value={seo.ogTitle ?? ""}
              onChange={(e) => set("ogTitle", e.target.value)}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">OG description</label>
              <textarea
                rows={2}
                value={seo.ogDescription ?? ""}
                onChange={(e) => set("ogDescription", e.target.value)}
                className="rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <Input
              label="OG image URL"
              value={seo.ogImage ?? ""}
              onChange={(e) => set("ogImage", e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
            <Button type="button" variant="secondary" className="w-auto px-4" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" className="w-auto px-4" loading={loading}>
              Save
            </Button>
          </div>
        </form>

        <div className="hidden w-72 shrink-0 flex-col gap-3 border-l border-border bg-surface-sunken p-5 lg:flex">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Preview</p>
          <OgPreviewCard
            title={seo.ogTitle || seo.title || pageName}
            description={seo.ogDescription || seo.description || ""}
            image={seo.ogImage}
            url={pageUrl}
          />
        </div>
      </div>
    </div>
  );
}
