import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchRender, RenderError } from "@site/lib/render-client";
import { LiveRenderer } from "@site/components/LiveRenderer";

interface Params {
  websiteId: string;
  path?: string[];
}

function toPath(segments?: string[]): string {
  return "/" + (segments ?? []).join("/");
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { websiteId, path } = await params;
  try {
    const data = await fetchRender(websiteId, toPath(path));
    const pageSeo = data.page.seo ?? {};
    const siteSeo = data.website.seo ?? {};
    const baseTitle = pageSeo.title || data.page.name;
    const title = siteSeo.titleTemplate?.includes("%s")
      ? siteSeo.titleTemplate.replace("%s", baseTitle)
      : baseTitle;
    const description = pageSeo.description || siteSeo.description || undefined;
    const ogImage = pageSeo.ogImage || (siteSeo.ogImage as string | undefined);

    return {
      title,
      description,
      alternates: pageSeo.canonicalUrl ? { canonical: pageSeo.canonicalUrl } : undefined,
      robots: pageSeo.robots || (siteSeo.robots as string | undefined),
      openGraph: {
        title: pageSeo.ogTitle || title,
        description: pageSeo.ogDescription || description,
        images: ogImage ? [ogImage] : undefined,
      },
      icons: data.website.faviconUrl ? { icon: data.website.faviconUrl } : undefined,
    };
  } catch {
    return { title: "Not found" };
  }
}

export default async function SitePage({ params }: { params: Promise<Params> }) {
  const { websiteId, path } = await params;
  let data;
  try {
    data = await fetchRender(websiteId, toPath(path));
  } catch (err) {
    if (err instanceof RenderError && (err.status === 404 || err.status === 400)) {
      notFound();
    }
    throw err;
  }
  return <LiveRenderer data={data} />;
}
