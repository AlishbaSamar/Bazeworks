"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { FormBanner } from "@/components/ui/FormBanner";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ApiError } from "@/lib/api-client";
import { useWorkspaceContext } from "@/lib/workspace-context";
import { websitesApi, type Website, type WebsiteOverview, type WebsiteSeo } from "@/lib/websites";
import { ROBOTS_OPTIONS } from "@/lib/pages";
import { uploadAsset } from "@/lib/media";
import { apiKeysApi, type ApiKey, type ApiKeyWithSecret } from "@/lib/api-keys";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

const TABS = ["Identity", "Search visibility", "Domain", "Deployment", "API access"] as const;
type Tab = (typeof TABS)[number];

export default function WebsiteSettingsPage() {
  const params = useParams<{ websiteId: string }>();
  const { activeWorkspace } = useWorkspaceContext();
  const canManage = activeWorkspace.role !== "VIEWER";

  const [website, setWebsite] = useState<WebsiteOverview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("Identity");

  const applyPatch = (patch: Partial<Website>) =>
    setWebsite((prev) => (prev ? { ...prev, ...patch } : prev));

  useEffect(() => {
    websitesApi
      .get(activeWorkspace.id, params.websiteId)
      .then(setWebsite)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : "Couldn't load settings."),
      );
  }, [activeWorkspace.id, params.websiteId]);

  if (error) return <FormBanner variant="error">{error}</FormBanner>;
  if (!website) return <p className="text-sm text-muted-foreground">Loading settings…</p>;

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
        <h1 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">Website settings</h1>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              tab === t
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Identity" && (
        <IdentityTab website={website} canManage={canManage} onSaved={applyPatch} workspaceId={activeWorkspace.id} />
      )}
      {tab === "Search visibility" && (
        <SeoTab website={website} canManage={canManage} onSaved={applyPatch} workspaceId={activeWorkspace.id} />
      )}
      {tab === "Domain" && <DomainTab website={website} />}
      {tab === "Deployment" && (
        <p className="rounded-xl border border-dashed border-border-strong px-4 py-10 text-center text-sm text-muted-foreground">
          Deployment settings and status arrive with Vercel deployment (Day 12).
        </p>
      )}
      {tab === "API access" && (
        <ApiAccessTab websiteId={website.id} workspaceId={activeWorkspace.id} canManage={canManage} />
      )}
    </div>
  );
}

function UploadField({
  label,
  value,
  onChange,
  workspaceId,
  websiteId,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  workspaceId: string;
  websiteId: string;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-surface-sunken">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-full w-full object-contain" />
          ) : (
            <span className="text-[10px] text-muted-foreground">None</span>
          )}
        </div>
        <Button
          type="button"
          variant="secondary"
          className="w-auto px-3"
          loading={busy}
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          {value ? "Replace" : "Upload"}
        </Button>
        {value && !disabled && (
          <button type="button" onClick={() => onChange("")} className="text-xs text-muted-foreground hover:text-destructive">
            Remove
          </button>
        )}
      </div>
      {err && <p className="text-xs text-destructive">{err}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/svg+xml"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setBusy(true);
          setErr(null);
          try {
            const asset = await uploadAsset(workspaceId, websiteId, file);
            onChange(asset.url);
          } catch (uploadErr) {
            setErr(uploadErr instanceof Error ? uploadErr.message : "Upload failed.");
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}

function IdentityTab({
  website,
  canManage,
  onSaved,
  workspaceId,
}: {
  website: WebsiteOverview;
  canManage: boolean;
  onSaved: (w: Website) => void;
  workspaceId: string;
}) {
  const [name, setName] = useState(website.name);
  const [slug, setSlug] = useState(website.slug);
  const [logoUrl, setLogoUrl] = useState(website.logoUrl ?? "");
  const [faviconUrl, setFaviconUrl] = useState(website.faviconUrl ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [err, setErr] = useState<string | null>(null);

  async function save() {
    setState("saving");
    setErr(null);
    try {
      const updated = await websitesApi.updateIdentity(workspaceId, website.id, {
        name,
        slug,
        logoUrl,
        faviconUrl,
      });
      onSaved(updated);
      setState("saved");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Couldn't save.");
      setState("idle");
    }
  }

  return (
    <div className="flex max-w-lg flex-col gap-4 rounded-xl border border-border bg-surface p-5">
      {err && <FormBanner variant="error">{err}</FormBanner>}
      <Input label="Website name" value={name} onChange={(e) => setName(e.target.value)} disabled={!canManage} />
      <Input
        label="Slug"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
        disabled={!canManage}
        error={slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) ? "Lowercase letters, numbers and hyphens only." : undefined}
      />
      <UploadField label="Logo" value={logoUrl} onChange={setLogoUrl} workspaceId={workspaceId} websiteId={website.id} disabled={!canManage} />
      <UploadField label="Favicon" value={faviconUrl} onChange={setFaviconUrl} workspaceId={workspaceId} websiteId={website.id} disabled={!canManage} />
      {canManage && (
        <div className="flex items-center gap-2">
          <Button className="w-auto px-4" loading={state === "saving"} onClick={save}>
            Save changes
          </Button>
          {state === "saved" && <span className="text-xs font-medium text-success">Saved</span>}
        </div>
      )}
    </div>
  );
}

function SeoTab({
  website,
  canManage,
  onSaved,
  workspaceId,
}: {
  website: WebsiteOverview;
  canManage: boolean;
  onSaved: (w: Website) => void;
  workspaceId: string;
}) {
  const [seo, setSeo] = useState<WebsiteSeo>({
    indexable: true,
    robots: "index,follow",
    ...website.seo,
  });
  const [state, setState] = useState<"idle" | "saving" | "saved">("idle");
  const [err, setErr] = useState<string | null>(null);
  const sitemapUrl = `${API_URL}/public/sites/${website.id}/sitemap.xml`;
  const robotsUrl = `${API_URL}/public/sites/${website.id}/robots.txt`;

  function set<K extends keyof WebsiteSeo>(key: K, value: WebsiteSeo[K]) {
    setSeo((prev) => ({ ...prev, [key]: value }));
    setState("idle");
  }

  async function save() {
    setState("saving");
    setErr(null);
    try {
      const updated = await websitesApi.updateSeo(workspaceId, website.id, seo);
      onSaved(updated);
      setState("saved");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Couldn't save.");
      setState("idle");
    }
  }

  return (
    <div className="flex max-w-lg flex-col gap-4 rounded-xl border border-border bg-surface p-5">
      {err && <FormBanner variant="error">{err}</FormBanner>}

      <label className="flex items-start gap-2.5 text-sm">
        <input
          type="checkbox"
          checked={seo.indexable !== false}
          onChange={(e) => set("indexable", e.target.checked)}
          disabled={!canManage}
          className="mt-0.5 h-4 w-4 rounded border-border"
        />
        <span>
          <span className="font-medium text-foreground">Allow search engines to index this site</span>
          <span className="block text-xs text-muted-foreground">
            When off, robots.txt disallows all crawlers.
          </span>
        </span>
      </label>

      <Input
        label="Title template"
        placeholder="%s — Acme"
        value={seo.titleTemplate ?? ""}
        onChange={(e) => set("titleTemplate", e.target.value)}
        disabled={!canManage}
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Default meta description</label>
        <textarea
          rows={2}
          value={seo.description ?? ""}
          onChange={(e) => set("description", e.target.value)}
          disabled={!canManage}
          className="rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-foreground">Default robots directive</label>
        <select
          value={seo.robots ?? "index,follow"}
          onChange={(e) => set("robots", e.target.value as WebsiteSeo["robots"])}
          disabled={!canManage}
          className="h-11 rounded-md border border-border bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {ROBOTS_OPTIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      <Input
        label="Default OG image URL"
        value={seo.ogImage ?? ""}
        onChange={(e) => set("ogImage", e.target.value)}
        disabled={!canManage}
      />

      {canManage && (
        <div className="flex items-center gap-2">
          <Button className="w-auto px-4" loading={state === "saving"} onClick={save}>
            Save changes
          </Button>
          {state === "saved" && <span className="text-xs font-medium text-success">Saved</span>}
        </div>
      )}

      <div className="mt-1 flex flex-col gap-1 rounded-lg bg-surface-sunken p-3 text-xs">
        <span className="font-medium text-foreground">Generated automatically</span>
        <a href={sitemapUrl} target="_blank" rel="noreferrer" className="text-primary underline">sitemap.xml</a>
        <a href={robotsUrl} target="_blank" rel="noreferrer" className="text-primary underline">robots.txt</a>
      </div>
    </div>
  );
}

function DomainTab({ website }: { website: WebsiteOverview }) {
  return (
    <div className="flex max-w-lg flex-col gap-3 rounded-xl border border-border bg-surface p-5 text-sm">
      <div className="flex justify-between">
        <span className="text-muted-foreground">Default deployment URL</span>
        <span className="font-medium text-foreground">{website.productionUrl ?? "Not deployed yet"}</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Custom domains are a later-phase feature. The default Vercel URL is assigned on first deploy (Day 12).
      </p>
    </div>
  );
}

function ApiAccessTab({
  websiteId,
  workspaceId,
  canManage,
}: {
  websiteId: string;
  workspaceId: string;
  canManage: boolean;
}) {
  const [keys, setKeys] = useState<ApiKey[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<ApiKeyWithSecret | null>(null);
  const [revoking, setRevoking] = useState<ApiKey | null>(null);

  const baseUrl = `${API_URL}/v1`;

  useEffect(() => {
    apiKeysApi
      .list(workspaceId, websiteId)
      .then(setKeys)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Couldn't load API keys."));
  }, [workspaceId, websiteId]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      const key = await apiKeysApi.create(workspaceId, websiteId, newName.trim());
      setCreated(key);
      setKeys((prev) => [{ ...key, key: undefined } as unknown as ApiKey, ...(prev ?? [])]);
      setNewName("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't create the key.");
    } finally {
      setCreating(false);
    }
  }

  async function revoke() {
    if (!revoking) return;
    try {
      await apiKeysApi.revoke(workspaceId, websiteId, revoking.id);
      setKeys((prev) =>
        (prev ?? []).map((k) => (k.id === revoking.id ? { ...k, revokedAt: new Date().toISOString() } : k)),
      );
      setRevoking(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't revoke the key.");
      throw err;
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <FormBanner variant="error">{error}</FormBanner>}

      <div className="rounded-xl border border-border bg-surface p-5 text-sm">
        <p className="font-medium text-foreground">Headless API</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Read this website&apos;s published pages, collections and entries from anywhere. Send the key as{" "}
          <code className="rounded bg-surface-sunken px-1">Authorization: Bearer &lt;key&gt;</code>.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-md bg-surface-sunken p-3 text-xs">
{`curl ${baseUrl}/collections/blog-posts/entries \\
  -H "Authorization: Bearer <your-key>"`}
        </pre>
        <p className="mt-2 text-xs text-muted-foreground">
          Base URL: <code className="rounded bg-surface-sunken px-1">{baseUrl}</code>
        </p>
      </div>

      {created && (
        <div className="rounded-xl border border-success/30 bg-success-soft p-4">
          <p className="text-sm font-medium text-success">Copy your key now — it won&apos;t be shown again.</p>
          <div className="mt-2 flex items-center gap-2">
            <input readOnly value={created.key} className="h-9 flex-1 rounded-md border border-border bg-white px-3 font-mono text-xs" />
            <Button
              variant="secondary"
              className="w-auto px-3"
              onClick={() => navigator.clipboard.writeText(created.key)}
            >
              Copy
            </Button>
          </div>
        </div>
      )}

      {canManage && (
        <form onSubmit={create} className="flex items-end gap-2 rounded-xl border border-border bg-surface p-4">
          <div className="flex-1">
            <Input label="New key name" placeholder="e.g. Production site" value={newName} onChange={(e) => setNewName(e.target.value)} required />
          </div>
          <Button type="submit" className="w-auto px-4" loading={creating}>Create key</Button>
        </form>
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {keys === null ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">Loading keys…</p>
        ) : keys.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">No API keys yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {keys.map((k) => (
              <li key={k.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {k.name}
                    {k.revokedAt && <span className="ml-2 text-xs font-normal text-destructive">revoked</span>}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">{k.prefix}…</p>
                </div>
                {canManage && !k.revokedAt && (
                  <button
                    type="button"
                    onClick={() => setRevoking(k)}
                    className="text-xs font-medium text-muted-foreground hover:text-destructive"
                  >
                    Revoke
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      {revoking && (
        <ConfirmDialog
          title={`Revoke "${revoking.name}"?`}
          message="Any integration using this key will immediately lose access. This can't be undone."
          confirmLabel="Revoke key"
          danger
          onConfirm={revoke}
          onClose={() => setRevoking(null)}
        />
      )}
    </div>
  );
}
