import Link from "next/link";
import type { Progress } from "@/lib/collection/service";
import { AlbumCover } from "./album-cover";
import { AlbumProgress, deriveProgressState, type ProgressState } from "./album-progress";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AddAlbumButton } from "@/app/app/albums/add-button";

/**
 * UI-05B productive AlbumCard.
 *
 * Server Component. Renders an `<article>` with the token-driven cover,
 * title, editorial metadata, progress block and a discriminated `action`
 * that swaps between "open the collection", "you already own it" and
 * "add it to my collection". The discriminated union keeps the call
 * site honest about which side-effects are wired (server action vs.
 * link) instead of pretending a bag of booleans is type-safe.
 */
export type AlbumCardAction =
  | { kind: "open"; href: string; label?: string }
  | { kind: "in-collection"; href: string }
  | { kind: "add"; albumId: string };

export type AlbumCardProps = {
  title: string;
  subtitle?: string | null;
  meta?: string | null;
  progress: Progress;
  coverUrl: string | null;
  action: AlbumCardAction;
  className?: string;
};

const STATE_LABELS: Record<ProgressState, string> = {
  low: "Bajo",
  in_progress: "En progreso",
  complete: "Completo",
};

/**
 * Badge variants for the progress state.
 *
 * The productive violet `primary` is reserved for the progress bar and the
 * main CTA, so the in-progress badge switches to the orange `accent` token
 * to give that hue real presence on the card. `Bajo` uses `secondary` so
 * the muted state does not compete with the bar. `Completo` keeps
 * `success` — green is reserved for completed-state semantics and
 * "En mi colección".
 */
const STATE_VARIANT: Record<ProgressState, BadgeVariant> = {
  low: "secondary",
  in_progress: "accent",
  complete: "success",
};

function joinClasses(...parts: Array<string | undefined | null | false>): string {
  return parts.filter(Boolean).join(" ");
}

function titleIdFor(title: string): string {
  const slug = title.replace(/\s+/g, "-").toLowerCase().slice(0, 40);
  return `album-card-title-${slug || "untitled"}`;
}

function editorialSummary(subtitle?: string | null, meta?: string | null) {
  if (subtitle && meta) return `${subtitle} · ${meta}`;
  if (subtitle) return subtitle;
  if (meta) return meta;
  return "Sin datos editoriales";
}

export function AlbumCard({
  title,
  subtitle,
  meta,
  progress,
  coverUrl,
  action,
  className,
}: AlbumCardProps) {
  const state = deriveProgressState(progress);
  const titleId = titleIdFor(title);
  const subtitleText = editorialSummary(subtitle, meta);
  const hasEditorial = Boolean(subtitle || meta);

  return (
    <article
      aria-labelledby={titleId}
      data-testid="album-card"
      data-action-kind={action.kind}
      className={joinClasses(
        // Compact, collection-friendly card. The max-w keeps a single album
        // from stretching across the whole grid; the parent <li> still
        // flexes to the cell, so the card never overflows its column.
        "group flex h-full max-w-xs flex-col gap-2 rounded-card border border-border bg-surface p-3 shadow-none",
        "transition-shadow duration-[var(--transition-normal)] ease-[var(--ease-standard)]",
        "hover:shadow-md focus-within:shadow-md",
        className,
      )}
    >
      <div className="mx-auto w-full max-w-[10rem]">
        <AlbumCover coverUrl={coverUrl} title={title} />
      </div>
      <div className="flex flex-col gap-1">
        <h2 id={titleId} className="line-clamp-2 text-sm font-semibold leading-snug text-content">
          {title}
        </h2>
        <p className="line-clamp-1 text-xs text-muted">
          {hasEditorial ? subtitleText : "Sin datos editoriales"}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant={STATE_VARIANT[state]}>{STATE_LABELS[state]}</Badge>
      </div>
      <AlbumProgress progress={progress} />
      <div className="pt-1">
        {action.kind === "open" ? (
          // min-h-11 enforces the 44 px touch target on mobile even when
          // the compact `size="md"` Button (h-10) would otherwise feel
          // cramped; the visual height stays md, the hit area grows only
          // on touch.
          <Button asChild className="w-full min-h-11" size="md">
            <Link href={action.href}>{action.label ?? "Abrir álbum"}</Link>
          </Button>
        ) : null}
        {action.kind === "in-collection" ? (
          <div className="flex flex-col items-stretch gap-2">
            <Badge variant="success">En mi colección</Badge>
            <Button asChild variant="secondary" className="w-full min-h-11" size="md">
              <Link href={action.href}>Abrir álbum</Link>
            </Button>
          </div>
        ) : null}
        {action.kind === "add" ? <AddAlbumButton albumId={action.albumId} /> : null}
      </div>
    </article>
  );
}