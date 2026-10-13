/**
 * UI-05B token-driven album cover.
 *
 * Server Component. Renders a 3:4 placeholder when `coverUrl` is null, and a
 * real `<img>` (without `onError` to keep the component server-renderable)
 * when the URL is provided. The placeholder is intentionally composed with
 * simple CSS shapes and tokens so it looks designed instead of broken: a
 * surface-soft base, a primary-tinted diagonal band that evokes a book spine,
 * an accent "seal" in the bottom-right, and the album's initials centred
 * in muted text. No SVG, no external assets, no JavaScript.
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
        "relative aspect-[3/4] w-full overflow-hidden rounded-card border border-border bg-surface-soft",
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
          <div
            aria-hidden="true"
            data-testid="album-cover-placeholder"
            className="absolute inset-0 bg-[linear-gradient(135deg,var(--album-primary)_0%,var(--album-primary)_18%,transparent_18%,transparent_100%)]"
          />
          <div
            aria-hidden="true"
            className="absolute bottom-3 right-3 size-8 rounded-full border border-border bg-accent"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 flex items-center justify-center"
          >
            <span className="select-none text-3xl font-semibold uppercase tracking-wider text-muted">
              {initialsFor(title)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}