"use client";

import { useEffect, useState } from "react";

export function albumCoverPresentation(url: string | null, title: string) {
  return url
    ? { kind: "image" as const, src: url, alt: `Portada de ${title}` }
    : { kind: "placeholder" as const, label: "Sin portada" };
}

function CoverPlaceholder() {
  return (
    <div
      className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 rounded border border-border bg-surface-muted p-4 text-center text-muted"
      data-testid="album-cover-placeholder"
    >
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-9 w-9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="4" y="3" width="16" height="18" rx="2" />
        <path d="m7 16 3-3 2 2 2-2 3 3" />
        <circle cx="9" cy="8" r="1.25" />
      </svg>
      <span className="text-xs">Sin portada</span>
    </div>
  );
}

/**
 * Displays an administrator-provided cover URL without weakening Next.js image
 * host restrictions. A failed request degrades to the same neutral placeholder
 * used when no URL is configured.
 */
export function AlbumCover({ url, title }: { url: string | null; title: string }) {
  const [failed, setFailed] = useState(false);

  useEffect(() => setFailed(false), [url]);

  const presentation = albumCoverPresentation(url, title);
  if (presentation.kind === "placeholder" || failed) return <CoverPlaceholder />;

  return (
    // The catalog accepts arbitrary administrator-provided HTTPS hosts, so a
    // native image is safer here than opening a global next/image allowlist.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={presentation.src}
      alt={presentation.alt}
      className="aspect-[3/4] w-full rounded border border-border bg-surface-muted object-contain"
      onError={() => setFailed(true)}
    />
  );
}

export { CoverPlaceholder };
