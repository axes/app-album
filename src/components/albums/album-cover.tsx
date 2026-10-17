/**
 * UI-05B (visual polish) token-driven album cover.
 *
 * Server Component. Renders a 3:4 placeholder when `coverUrl` is null, and a
 * real `<img>` (without `onError` to keep the component server-renderable)
 * when the URL is provided. The placeholder is intentionally composed with
 * simple CSS shapes and tokens so it looks designed instead of broken: a
 * surface-soft base, a thin primary-tinted diagonal band, a vertical
 * accent stripe, an outlined accent seal in the bottom-right, and the
 * album's initials centred in muted text. No SVG, no external assets,
 * no JavaScript. The accent shapes live strictly inside the placeholder
 * branch — when a real `coverUrl` is provided, only the `<img>` is
 * rendered, with no overlay decoration on top.
 *
 * The layout is prepared so that swapping in a real `coverUrl` later is a
 * one-line change in `AlbumCard` — the same wrapper is reused, only the
 * inner node changes.
 */
export type AlbumCoverProps = {
  coverUrl: string | null;
  title: string;
  className?: string;
};

function initialsFor(title: string): string {
  const cleaned = title.trim().toUpperCase();
  if (!cleaned) return "·";
  return cleaned.slice(0, 2);
}

function joinClasses(...parts: Array<string | undefined | null | false>): string {
  return parts.filter(Boolean).join(" ");
}

export function AlbumCover({ coverUrl, title, className }: AlbumCoverProps) {
  return (
    <div
      data-testid="album-cover"
      data-placeholder={coverUrl ? "false" : "true"}
      className={joinClasses(
        "relative aspect-[3/4] w-full overflow-hidden rounded-card border border-border bg-surface-muted",
        className,
      )}
    >
      {coverUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverUrl}
          alt={`Portada de ${title}`}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <>
          <span className="sr-only">Portada no disponible para {title}</span>
          {/* Thin diagonal band — evokes a book spine without dominating the cover. */}
          <div
            aria-hidden="true"
            data-testid="album-cover-placeholder"
            className="absolute inset-0 bg-[linear-gradient(135deg,var(--album-primary)_0%,var(--album-primary)_12%,transparent_12%,transparent_100%)]"
          />
          {/* Vertical accent stripe on the left — keeps the orange token present. */}
          <div
            aria-hidden="true"
            className="absolute inset-y-0 left-0 w-2 bg-accent"
          />
          {/* Outlined accent seal in the bottom-right — light visual weight, full hue. */}
          <div
            aria-hidden="true"
            className="absolute bottom-3 right-3 size-9 rounded-full border-2 border-accent"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center pl-2"
          >
            <span className="type-sticker-number select-none tracking-wider text-muted">
              {initialsFor(title)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
