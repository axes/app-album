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

const STATE_VARIANT: Record<ProgressState, BadgeVariant> = {
  low: "info",
  in_progress: "primary",
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
        "group flex h-full flex-col gap-3 rounded-card border border-border bg-surface p-4 shadow-none",
        "transition-shadow duration-[var(--transition-normal)] ease-[var(--ease-standard)]",
        "hover:shadow-md focus-within:shadow-md",
        className,
      )}
    >
      <AlbumCover coverUrl={coverUrl} title={title} />
      <div className="flex flex-col gap-1">
        <h2 id={titleId} className="line-clamp-2 text-base font-semibold leading-snug text-content">
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
      <div className="mt-auto pt-2">
        {action.kind === "open" ? (
          <Button asChild className="w-full">
            <Link href={action.href}>{action.label ?? "Abrir álbum"}</Link>
          </Button>
        ) : null}
        {action.kind === "in-collection" ? (
          <div className="flex flex-col items-stretch gap-2">
            <Badge variant="success">En mi colección</Badge>
            <Button asChild variant="secondary" className="w-full">
              <Link href={action.href}>Abrir álbum</Link>
            </Button>
          </div>
        ) : null}
        {action.kind === "add" ? <AddAlbumButton albumId={action.albumId} /> : null}
      </div>
    </article>
  );
}