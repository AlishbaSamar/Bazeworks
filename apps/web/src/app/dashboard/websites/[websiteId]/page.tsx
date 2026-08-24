"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FormBanner } from "@/components/ui/FormBanner";
import { Button } from "@/components/ui/Button";
import { ApiError } from "@/lib/api-client";
import { websitesApi, type WebsiteOverview } from "@/lib/websites";
import { useWorkspaceContext } from "@/lib/workspace-context";
import { timeAgo } from "@/lib/format";

const STATUS_LABEL: Record<WebsiteOverview["status"], string> = {
  DRAFT: "Draft",
  LIVE: "Live",
};

const STATUS_CLASSES: Record<WebsiteOverview["status"], string> = {
  DRAFT: "bg-surface-sunken text-muted-foreground border-border",
  LIVE: "bg-success-soft text-success border-success/20",
};

export default function WebsiteOverviewPage() {
  const params = useParams<{ websiteId: string }>();
  const { activeWorkspace } = useWorkspaceContext();

  const [website, setWebsite] = useState<WebsiteOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    websitesApi
      .get(activeWorkspace.id, params.websiteId)
      .then((data) => {
        if (!cancelled) {
          setWebsite(data);
          setError(null);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError && err.status === 404
            ? "This website doesn't exist in the current workspace."
            : "Couldn't load this website.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id, params.websiteId]);

  if (error) {
    return (
      <div className="flex flex-col gap-4">
        <FormBanner variant="error">{error}</FormBanner>
        <Link href="/dashboard" className="text-sm font-medium text-foreground hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  if (!website) {
    return <p className="text-sm text-muted-foreground">Loading website…</p>;
  }

  return (
    <div>
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path
            fillRule="evenodd"
            d="M17 10a.75.75 0 01-.75.75H5.56l3.72 3.72a.75.75 0 11-1.06 1.06l-5-5a.75.75 0 010-1.06l5-5a.75.75 0 111.06 1.06L5.56 9.25H16.25A.75.75 0 0117 10z"
            clipRule="evenodd"
          />
        </svg>
        Back to dashboard
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{website.name}</h1>
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[website.status]}`}
            >
              {STATUS_LABEL[website.status]}
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{website.slug}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="w-auto px-4" disabled title="Coming Day 8">
            Preview
          </Button>
          <Button variant="secondary" className="w-auto px-4" disabled title="Coming Day 11">
            Publish Draft
          </Button>
          <Button className="w-auto px-4" disabled title="Coming Day 12">
            Deploy
          </Button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">At a glance</p>
          <dl className="mt-3 flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between border-b border-border pb-2.5">
              <dt className="text-muted-foreground">Environment</dt>
              <dd className="font-medium text-foreground">{STATUS_LABEL[website.status]}</dd>
            </div>
            <div className="flex justify-between border-b border-border pb-2.5">
              <dt className="text-muted-foreground">Domain</dt>
              <dd className="font-medium text-foreground">—</dd>
            </div>
            <div className="flex justify-between border-b border-border pb-2.5">
              <dt className="text-muted-foreground">Last Modified</dt>
              <dd className="font-medium text-foreground">{timeAgo(website.updatedAt)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Owner</dt>
              <dd className="font-medium text-foreground">{website.owner.name}</dd>
            </div>
          </dl>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-sunken text-foreground">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <ellipse cx="12" cy="6" rx="8" ry="3" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
              </svg>
            </div>
            <p className="mt-3 text-lg font-semibold text-foreground">0</p>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Collections</p>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-sunken text-foreground">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
                <circle cx="8.5" cy="9.5" r="1.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 17l5-5 3.5 3.5L16 12l4.5 5" />
              </svg>
            </div>
            <p className="mt-3 text-lg font-semibold text-foreground">0</p>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Media assets</p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-surface p-5 shadow-sm">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Pages ({website.pages.length})
        </p>
        {website.pages.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">No pages yet.</p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {website.pages.map((page) => (
              <li key={page.id}>
                <Link
                  href={`/editor/${activeWorkspace.id}/${website.id}/${page.id}`}
                  className="group flex items-center justify-between rounded-lg border border-border px-3.5 py-2.5 text-sm transition-colors hover:border-border-strong hover:bg-surface-sunken"
                >
                  <span className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-surface-sunken text-muted-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                        <rect x="4" y="3" width="16" height="18" rx="2" />
                        <path strokeLinecap="round" d="M8 8h8M8 12h8M8 16h5" />
                      </svg>
                    </span>
                    <span className="font-medium text-foreground">{page.name}</span>
                  </span>
                  <span className="text-muted-foreground">{page.slug}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
