"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FormBanner } from "@/components/ui/FormBanner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ApiError } from "@/lib/api-client";
import { useWorkspaceContext } from "@/lib/workspace-context";
import {
  ACCEPTED_MIME,
  mediaApi,
  uploadAsset,
  type Asset,
  type AssetKind,
} from "@/lib/media";
import { formatBytes } from "@/lib/format";

const KIND_FILTERS: { label: string; value: AssetKind | "ALL" }[] = [
  { label: "All", value: "ALL" },
  { label: "Images", value: "IMAGE" },
  { label: "Videos", value: "VIDEO" },
  { label: "Documents", value: "DOCUMENT" },
];

function AssetThumb({ asset }: { asset: Asset }) {
  if (asset.kind === "IMAGE") {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={asset.url} alt={asset.alt || asset.filename} className="h-full w-full object-cover" />;
  }
  return (
    <div className="flex h-full w-full items-center justify-center bg-surface-sunken text-muted-foreground">
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        {asset.kind === "VIDEO" ? (
          <>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M10 9l5 3-5 3z" fill="currentColor" stroke="none" />
          </>
        ) : (
          <>
            <path d="M14 3v5h5" />
            <path d="M7 3h8l5 5v13H7z" />
          </>
        )}
      </svg>
    </div>
  );
}

export default function MediaLibraryPage() {
  const params = useParams<{ websiteId: string }>();
  const { activeWorkspace } = useWorkspaceContext();
  const canManage = activeWorkspace.role !== "VIEWER";

  const [assets, setAssets] = useState<Asset[] | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [kind, setKind] = useState<AssetKind | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState<Asset | null>(null);
  const [deleting, setDeleting] = useState<Asset | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(
    (cursor?: string) => {
      const query = {
        kind: kind === "ALL" ? undefined : kind,
        q: search.trim() || undefined,
        cursor,
      };
      return mediaApi
        .list(activeWorkspace.id, params.websiteId, query)
        .then((page) => {
          setAssets((prev) => (cursor ? [...(prev ?? []), ...page.assets] : page.assets));
          setNextCursor(page.nextCursor);
          setError(null);
        })
        .catch((err) => {
          setError(err instanceof ApiError ? err.message : "Couldn't load media.");
        });
    },
    [activeWorkspace.id, params.websiteId, kind, search],
  );

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setAssets(null);
    });
    const t = setTimeout(() => void load(), 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [load]);

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (list.length === 0) return;
    setError(null);
    setUploading((n) => n + list.length);
    for (const file of list) {
      try {
        const asset = await uploadAsset(activeWorkspace.id, params.websiteId, file);
        setAssets((prev) => [asset, ...(prev ?? [])]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setUploading((n) => n - 1);
      }
    }
  }

  async function handleDelete() {
    if (!deleting) return;
    try {
      await mediaApi.remove(activeWorkspace.id, params.websiteId, deleting.id);
      setAssets((prev) => (prev ?? []).filter((a) => a.id !== deleting.id));
      if (selected?.id === deleting.id) setSelected(null);
      setDeleting(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't delete that asset.");
      throw err;
    }
  }

  async function copyUrl(asset: Asset) {
    try {
      await navigator.clipboard.writeText(asset.url);
      setCopiedId(asset.id);
      setTimeout(() => setCopiedId((c) => (c === asset.id ? null : c)), 1500);
    } catch {
      setError("Couldn't copy to clipboard.");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <Link
          href={`/dashboard/websites/${params.websiteId}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.56l3.72 3.72a.75.75 0 11-1.06 1.06l-5-5a.75.75 0 010-1.06l5-5a.75.75 0 111.06 1.06L5.56 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" />
          </svg>
          Back to website
        </Link>
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">Media library</h1>
        <p className="mt-1 text-sm text-muted-foreground">Images, videos and documents for this website.</p>
      </div>

      {error && <FormBanner variant="error">{error}</FormBanner>}

      {canManage && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            void handleFiles(e.dataTransfer.files);
          }}
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
            dragging ? "border-primary bg-primary/5" : "border-border-strong bg-surface"
          }`}
        >
          <p className="text-sm font-medium text-foreground">
            Drag files here, or{" "}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-primary underline underline-offset-2"
            >
              browse
            </button>
          </p>
          <p className="text-xs text-muted-foreground">Images up to 10 MB · MP4 up to 200 MB · PDF up to 25 MB</p>
          {uploading > 0 && (
            <p className="text-xs font-medium text-primary">Uploading {uploading}…</p>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_MIME}
            className="hidden"
            onChange={(e) => {
              if (e.target.files) void handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1.5">
          {KIND_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setKind(f.value)}
              className={`h-9 rounded-full border px-3.5 text-sm font-medium transition-colors ${
                kind === f.value
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-white text-muted-foreground hover:border-border-strong hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Search by filename…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 w-56 rounded-md border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {assets === null ? (
        <p className="text-sm text-muted-foreground">Loading media…</p>
      ) : assets.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border-strong px-4 py-10 text-center text-sm text-muted-foreground">
          No media yet.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {assets.map((asset) => (
              <div
                key={asset.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => setSelected(asset)}
                  className="aspect-[4/3] w-full overflow-hidden"
                >
                  <AssetThumb asset={asset} />
                </button>
                <div className="flex items-center justify-between gap-1 px-2.5 py-2">
                  <span className="truncate text-xs font-medium text-foreground" title={asset.filename}>
                    {asset.filename}
                  </span>
                </div>
                <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={() => copyUrl(asset)}
                    title="Copy URL"
                    className="rounded-md bg-white/90 p-1.5 text-foreground shadow-sm hover:bg-white"
                  >
                    {copiedId === asset.id ? (
                      <svg className="h-3.5 w-3.5 text-success" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-8 8a1 1 0 01-1.4 0l-4-4a1 1 0 011.4-1.4L8 12.6l7.3-7.3a1 1 0 011.4 0z" clipRule="evenodd" /></svg>
                    ) : (
                      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path d="M7 5a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2h-1v-2h1V5H9v1H7V5z" /><path d="M3 7a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>
                    )}
                  </button>
                  {canManage && (
                    <button
                      type="button"
                      onClick={() => setDeleting(asset)}
                      title="Delete"
                      className="rounded-md bg-white/90 p-1.5 text-destructive shadow-sm hover:bg-white"
                    >
                      <svg className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.58.177-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5z" clipRule="evenodd" /></svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {nextCursor && (
            <div className="flex justify-center">
              <Button variant="secondary" className="w-auto px-4" onClick={() => void load(nextCursor)}>
                Load more
              </Button>
            </div>
          )}
        </>
      )}

      {selected && (
        <AssetDetailModal
          key={selected.id}
          asset={selected}
          canManage={canManage}
          onClose={() => setSelected(null)}
          onCopyUrl={() => copyUrl(selected)}
          onSaveAlt={async (alt) => {
            const updated = await mediaApi.updateAlt(activeWorkspace.id, params.websiteId, selected.id, alt);
            setAssets((prev) => (prev ?? []).map((a) => (a.id === updated.id ? updated : a)));
            setSelected(updated);
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title={`Delete "${deleting.filename}"?`}
          message="This removes the file from the library and storage. Pages still referencing its URL will show a broken asset."
          confirmLabel="Delete"
          danger
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  );
}

function AssetDetailModal({
  asset,
  canManage,
  onClose,
  onCopyUrl,
  onSaveAlt,
}: {
  asset: Asset;
  canManage: boolean;
  onClose: () => void;
  onCopyUrl: () => void;
  onSaveAlt: (alt: string) => Promise<void>;
}) {
  const [alt, setAlt] = useState(asset.alt);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  return (
    <div
      className="animate-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-modal flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="truncate text-sm font-semibold text-foreground">{asset.filename}</p>
          <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-1 text-muted-foreground hover:bg-surface-sunken hover:text-foreground">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-4">
          <div className="flex items-center justify-center rounded-lg bg-surface-sunken p-3">
            {asset.kind === "IMAGE" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={asset.url} alt={asset.alt || asset.filename} className="max-h-72 max-w-full rounded" />
            ) : asset.kind === "VIDEO" ? (
              <video src={asset.url} controls className="max-h-72 max-w-full rounded" />
            ) : (
              <a href={asset.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary underline">
                Open document
              </a>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            <div><dt className="text-muted-foreground">Type</dt><dd className="font-medium text-foreground">{asset.mimeType}</dd></div>
            <div><dt className="text-muted-foreground">Size</dt><dd className="font-medium text-foreground">{formatBytes(asset.bytes)}</dd></div>
            {asset.width && asset.height && (
              <div><dt className="text-muted-foreground">Dimensions</dt><dd className="font-medium text-foreground">{asset.width}×{asset.height}</dd></div>
            )}
          </dl>

          <div className="flex items-center gap-2">
            <input readOnly value={asset.url} className="h-9 flex-1 rounded-md border border-border bg-background px-3 text-xs text-muted-foreground" />
            <Button variant="secondary" className="w-auto px-3" onClick={onCopyUrl}>Copy URL</Button>
          </div>

          {canManage && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor="asset-alt" className="text-sm font-medium text-foreground">Alt text</label>
              <textarea
                id="asset-alt"
                rows={2}
                value={alt}
                onChange={(e) => {
                  setAlt(e.target.value);
                  setSaved(false);
                }}
                placeholder="Describe this asset for screen readers and SEO"
                className="rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="flex items-center gap-2">
                <Button
                  className="w-auto px-4"
                  loading={saving}
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await onSaveAlt(alt);
                      setSaved(true);
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  Save alt text
                </Button>
                {saved && <span className="text-xs font-medium text-success">Saved</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
