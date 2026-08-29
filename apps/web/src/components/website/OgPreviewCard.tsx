"use client";

/** Approximates how a link to this page looks when shared on social. */
export function OgPreviewCard({
  title,
  description,
  image,
  url,
}: {
  title: string;
  description: string;
  image?: string;
  url: string;
}) {
  let host = url;
  try {
    host = new URL(url).host;
  } catch {
    /* keep raw */
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-white">
      <div className="flex aspect-[1.91/1] w-full items-center justify-center bg-surface-sunken">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-muted-foreground">No OG image set</span>
        )}
      </div>
      <div className="flex flex-col gap-1 border-t border-border px-3 py-2.5">
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{host}</span>
        <span className="line-clamp-1 text-sm font-semibold text-foreground">
          {title || "Untitled page"}
        </span>
        <span className="line-clamp-2 text-xs text-muted-foreground">
          {description || "No description set — search engines will generate one from the page content."}
        </span>
      </div>
    </div>
  );
}
