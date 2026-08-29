"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FormBanner } from "@/components/ui/FormBanner";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CreatePageModal } from "@/components/website/CreatePageModal";
import { RenamePageDialog } from "@/components/website/RenamePageDialog";
import { DynamicPageModal } from "@/components/website/DynamicPageModal";
import { SaveAsTemplateDialog } from "@/components/website/SaveAsTemplateDialog";
import { PageSeoDialog } from "@/components/website/PageSeoDialog";
import { PublishDialog } from "@/components/website/PublishDialog";
import { DeploymentPanel } from "@/components/website/DeploymentPanel";
import { PageRow } from "@/components/website/PageRow";
import { ApiError } from "@/lib/api-client";
import { websitesApi, type WebsiteOverview } from "@/lib/websites";
import { pagesApi, type DynamicBindingInput, type Page } from "@/lib/pages";
import { collectionsApi } from "@/lib/collections";
import { publishingApi, type PublishStatus } from "@/lib/publishing";
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
  const [pages, setPages] = useState<Page[] | null>(null);
  const [collectionCount, setCollectionCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const [showCreatePage, setShowCreatePage] = useState(false);
  const [renamingPage, setRenamingPage] = useState<Page | null>(null);
  const [seoPage, setSeoPage] = useState<Page | null>(null);
  const [deletingPage, setDeletingPage] = useState<Page | null>(null);
  const [configuringDynamicPage, setConfiguringDynamicPage] = useState<Page | null>(null);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateNotice, setTemplateNotice] = useState<string | null>(null);
  const [publishStatus, setPublishStatus] = useState<PublishStatus | null>(null);
  const [showPublish, setShowPublish] = useState(false);
  const [publishNotice, setPublishNotice] = useState<string | null>(null);

  const canManage = activeWorkspace.role !== "VIEWER";
  const previewHref = `/preview/${activeWorkspace.id}/${params.websiteId}`;

  const refreshPublishStatus = useCallback(() => {
    publishingApi
      .status(activeWorkspace.id, params.websiteId)
      .then(setPublishStatus)
      .catch(() => {});
  }, [activeWorkspace.id, params.websiteId]);

  useEffect(() => {
    refreshPublishStatus();
  }, [refreshPublishStatus]);

  useEffect(() => {
    let cancelled = false;
    websitesApi
      .get(activeWorkspace.id, params.websiteId)
      .then((data) => {
        if (!cancelled) {
          setWebsite(data);
          setPages(data.pages.map((p) => ({ ...p, websiteId: data.id })));
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

  useEffect(() => {
    let cancelled = false;
    collectionsApi
      .list(activeWorkspace.id, params.websiteId)
      .then((list) => {
        if (!cancelled) setCollectionCount(list.length);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeWorkspace.id, params.websiteId]);

  function handlePageCreated(page: Page) {
    setShowCreatePage(false);
    setPages((prev) => (prev ? [...prev, page] : [page]));
  }

  async function handleRenamePage(page: Page, data: { name: string; slug: string }) {
    const updated = await pagesApi.rename(activeWorkspace.id, params.websiteId, page.id, data);
    setPages((prev) => prev?.map((p) => (p.id === page.id ? { ...p, ...updated } : p)) ?? null);
    setRenamingPage(null);
  }

  async function handleDuplicatePage(page: Page) {
    const copy = await pagesApi.duplicate(activeWorkspace.id, params.websiteId, page.id);
    setPages((prev) => (prev ? [...prev, { ...copy, websiteId: params.websiteId }] : [copy]));
  }

  async function handleToggleStatus(page: Page) {
    const nextStatus = page.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
    const updated = await pagesApi.updateStatus(activeWorkspace.id, params.websiteId, page.id, nextStatus);
    setPages((prev) => prev?.map((p) => (p.id === page.id ? { ...p, ...updated } : p)) ?? null);
  }

  async function handleSaveSeo(seo: NonNullable<Page["seo"]>) {
    if (!seoPage) return;
    const updated = await pagesApi.updateSeo(activeWorkspace.id, params.websiteId, seoPage.id, seo);
    setPages((prev) => prev?.map((p) => (p.id === seoPage.id ? { ...p, ...updated } : p)) ?? null);
    setSeoPage(null);
  }

  async function handleDeletePage() {
    if (!deletingPage) return;
    await pagesApi.remove(activeWorkspace.id, params.websiteId, deletingPage.id);
    setPages((prev) => prev?.filter((p) => p.id !== deletingPage.id) ?? null);
    setDeletingPage(null);
  }

  async function handleSaveDynamicBinding(input: DynamicBindingInput) {
    if (!configuringDynamicPage) return;
    const updated = await pagesApi.setDynamicBinding(activeWorkspace.id, params.websiteId, configuringDynamicPage.id, input);
    setPages((prev) => prev?.map((p) => (p.id === configuringDynamicPage.id ? { ...p, ...updated } : p)) ?? null);
    setConfiguringDynamicPage(null);
  }

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

  if (!website || !pages) {
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
            {publishStatus?.hasPendingChanges && (
              <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                Unpublished changes
              </span>
            )}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {website.slug}
            {publishStatus?.lastPublishedAt
              ? ` · published ${timeAgo(publishStatus.lastPublishedAt)}`
              : " · never published"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={previewHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 w-auto items-center justify-center gap-1.5 rounded-md border border-border bg-white px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-border-strong hover:bg-background"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M10 4c-3.6 0-6.7 2.1-8 5 1.3 2.9 4.4 5 8 5s6.7-2.1 8-5c-1.3-2.9-4.4-5-8-5zm0 8a3 3 0 110-6 3 3 0 010 6z" />
            </svg>
            Preview
          </Link>
          <Link
            href={`/dashboard/websites/${params.websiteId}/media`}
            className="inline-flex h-9 w-auto items-center justify-center rounded-md border border-border bg-white px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-border-strong hover:bg-background"
          >
            Media
          </Link>
          <Link
            href={`/dashboard/websites/${params.websiteId}/settings`}
            className="inline-flex h-9 w-auto items-center justify-center rounded-md border border-border bg-white px-4 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-border-strong hover:bg-background"
          >
            Settings
          </Link>
          {canManage && (
            <Button
              variant="secondary"
              className="w-auto px-4"
              onClick={() => setShowSaveTemplate(true)}
            >
              Save as template
            </Button>
          )}
          {canManage && (
            <Button
              className="w-auto px-4"
              onClick={() => setShowPublish(true)}
              disabled={publishStatus !== null && !publishStatus.hasPendingChanges}
              title={
                publishStatus && !publishStatus.hasPendingChanges
                  ? "Nothing new to publish"
                  : undefined
              }
            >
              Publish
            </Button>
          )}
        </div>
      </div>

      {templateNotice && (
        <div className="mt-4">
          <FormBanner variant="success">{templateNotice}</FormBanner>
        </div>
      )}

      {publishNotice && (
        <div className="mt-4">
          <FormBanner variant="success">{publishNotice}</FormBanner>
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">At a glance</p>
          <dl className="mt-3 flex flex-col gap-2.5 text-sm">
            <div className="flex justify-between border-b border-border pb-2.5">
              <dt className="text-muted-foreground">Environment</dt>
              <dd className="font-medium text-foreground">{STATUS_LABEL[website.status]}</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-border pb-2.5">
              <dt className="text-muted-foreground">Live URL</dt>
              <dd className="min-w-0 truncate font-medium text-foreground">
                {website.productionUrl ? (
                  <a href={website.productionUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {website.productionUrl.replace(/^https?:\/\//, "")}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
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
          <Link
            href={`/dashboard/websites/${website.id}/collections`}
            className="rounded-xl border border-border bg-surface p-5 shadow-sm transition-colors hover:border-border-strong hover:bg-surface-sunken"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface-sunken text-foreground">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <ellipse cx="12" cy="6" rx="8" ry="3" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6v12c0 1.66 3.58 3 8 3s8-1.34 8-3V6" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 12c0 1.66 3.58 3 8 3s8-1.34 8-3" />
              </svg>
            </div>
            <p className="mt-3 text-lg font-semibold text-foreground">{collectionCount}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Collections</p>
          </Link>
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

      <div className="mt-4">
        <DeploymentPanel
          workspaceId={activeWorkspace.id}
          websiteId={params.websiteId}
          canDeploy={activeWorkspace.role === "OWNER" || activeWorkspace.role === "ADMIN"}
          hasPublication={Boolean(publishStatus?.lastPublication)}
          productionUrl={website.productionUrl}
          onProductionUrl={(url) =>
            setWebsite((prev) => (prev ? { ...prev, productionUrl: url } : prev))
          }
        />
      </div>

      <div className="mt-4 rounded-xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Pages ({pages.length})
          </p>
          {canManage && (
            <Button className="w-auto px-3 py-1.5 text-xs" onClick={() => setShowCreatePage(true)}>
              <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
              </svg>
              Create Page
            </Button>
          )}
        </div>

        {pages.length === 0 ? (
          <div className="mt-3 flex flex-col items-center justify-center rounded-lg border border-dashed border-border-strong py-10 text-center">
            <p className="text-sm font-medium text-foreground">No pages yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Create a page to start building this website.</p>
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-2">
            {pages.map((page) => (
              <PageRow
                key={page.id}
                page={page}
                editorHref={`/editor/${activeWorkspace.id}/${website.id}/${page.id}`}
                canManage={canManage}
                onEdit={() => setRenamingPage(page)}
                onEditSeo={() => setSeoPage(page)}
                onDuplicate={() => handleDuplicatePage(page)}
                onToggleStatus={() => handleToggleStatus(page)}
                onConfigureDynamic={() => setConfiguringDynamicPage(page)}
                onDelete={() => setDeletingPage(page)}
              />
            ))}
          </div>
        )}
      </div>

      {showCreatePage && (
        <CreatePageModal
          workspaceId={activeWorkspace.id}
          websiteId={website.id}
          onClose={() => setShowCreatePage(false)}
          onCreated={handlePageCreated}
        />
      )}

      {renamingPage && (
        <RenamePageDialog
          initialName={renamingPage.name}
          initialSlug={renamingPage.slug}
          onClose={() => setRenamingPage(null)}
          onSave={(data) => handleRenamePage(renamingPage, data)}
        />
      )}

      {configuringDynamicPage && (
        <DynamicPageModal
          workspaceId={activeWorkspace.id}
          websiteId={website.id}
          page={configuringDynamicPage}
          onClose={() => setConfiguringDynamicPage(null)}
          onSave={handleSaveDynamicBinding}
        />
      )}

      {seoPage && (
        <PageSeoDialog
          key={seoPage.id}
          pageName={seoPage.name}
          pageSlug={seoPage.slug}
          siteBaseUrl={website.productionUrl ?? previewHref}
          initialSeo={seoPage.seo ?? {}}
          websiteRobotsDefault={website.seo?.robots}
          onClose={() => setSeoPage(null)}
          onSave={handleSaveSeo}
        />
      )}

      {showPublish && publishStatus && (
        <PublishDialog
          workspaceId={activeWorkspace.id}
          websiteId={params.websiteId}
          status={publishStatus}
          onClose={() => setShowPublish(false)}
          onPublished={(note) => {
            setShowPublish(false);
            setPublishNotice(
              `Published${note ? ` — "${note}"` : ""}. Deploy to make it live.`,
            );
            refreshPublishStatus();
            websitesApi
              .get(activeWorkspace.id, params.websiteId)
              .then(setWebsite)
              .catch(() => {});
          }}
        />
      )}

      {showSaveTemplate && (
        <SaveAsTemplateDialog
          workspaceId={activeWorkspace.id}
          websiteId={website.id}
          defaultName={website.name}
          onClose={() => setShowSaveTemplate(false)}
          onSaved={(templateName) => {
            setShowSaveTemplate(false);
            setTemplateNotice(`Saved "${templateName}" to your workspace templates.`);
          }}
        />
      )}

      {deletingPage && (
        <ConfirmDialog
          title="Delete page?"
          message={`"${deletingPage.name}" will be permanently deleted. This can't be undone.`}
          confirmLabel="Delete"
          danger
          onClose={() => setDeletingPage(null)}
          onConfirm={handleDeletePage}
        />
      )}
    </div>
  );
}
