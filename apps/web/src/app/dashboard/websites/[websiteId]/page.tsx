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
      <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground">
        ← Back to dashboard
      </Link>

      <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{website.name}</h1>
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
        <div className="rounded-lg border border-border bg-surface p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">At a glance</p>
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Environment</dt>
              <dd className="font-medium text-foreground">{STATUS_LABEL[website.status]}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Domain</dt>
              <dd className="font-medium text-foreground">—</dd>
            </div>
            <div className="flex justify-between">
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
          <div className="rounded-lg border border-border bg-surface p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Collections</p>
            <p className="mt-1 text-lg font-semibold text-foreground">0 collections</p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-5">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Media</p>
            <p className="mt-1 text-lg font-semibold text-foreground">0 assets</p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-surface p-5">
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
                  className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm transition-colors hover:border-border-strong hover:bg-background"
                >
                  <span className="font-medium text-foreground">{page.name}</span>
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
