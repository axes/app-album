import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlbumCover } from "@/app/admin/albums/album-cover";
import { DrizzleCollectionRepository } from "@/lib/collection/drizzle-repository";
import { CollectionService, type PublicAlbumView } from "@/lib/collection/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Colección compartida",
  robots: { index: false, follow: false },
};

async function loadShared(token: string): Promise<PublicAlbumView> {
  const view = await new CollectionService(new DrizzleCollectionRepository()).getPublicAlbumByToken(token);
  // Unknown, disabled, malformed and deleted-collection tokens all collapse to
  // the same 404 so the endpoint cannot be used to enumerate links.
  if (!view) notFound();
  return view;
}

function StickerList({ stickers }: { stickers: Array<{ code: string; name: string | null }> }) {
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {stickers.map((sticker) => (
        <li className="min-w-0 rounded border border-border bg-surface p-2" key={sticker.code}>
          <code className="block truncate text-sm font-semibold" title={sticker.code}>{sticker.code}</code>
          {sticker.name ? <span className="block truncate text-xs text-muted" title={sticker.name}>{sticker.name}</span> : null}
        </li>
      ))}
    </ul>
  );
}

export default async function SharedAlbumPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const view = await loadShared(token);

  return (
    <section className="flex flex-col gap-6">
      <header className="grid gap-5 rounded border border-border bg-surface p-4 sm:grid-cols-[10rem_1fr]">
        <div className="mx-auto w-32 sm:w-full">
          <AlbumCover title={view.album.title} url={view.album.coverUrl} />
        </div>
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-2xl font-semibold">{view.album.title}</h1>
            <p className="text-sm text-muted">
              {[view.album.publisher, view.album.year].filter(Boolean).join(" · ") || "Sin datos editoriales"}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <p className="font-medium tabular-nums">
              {view.progress.owned} / {view.progress.total} láminas · {view.progress.percentage}%
            </p>
            <div
              aria-label={`${view.progress.percentage}% completado`}
              aria-valuemax={100}
              aria-valuemin={0}
              aria-valuenow={view.progress.percentage}
              className="h-2 overflow-hidden rounded bg-surface-muted"
              role="progressbar"
            >
              <div className="h-full bg-success" style={{ width: `${view.progress.percentage}%` }} />
            </div>
            <p className="text-sm text-muted">
              {view.progress.missing} faltantes · {view.progress.duplicates} repetidas
            </p>
          </div>
        </div>
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Faltantes</h2>
        {view.missing.length === 0 ? (
          <p className="rounded border border-border bg-surface p-4 text-success">Álbum completo</p>
        ) : (
          view.missing.map((group) => (
            <details className="rounded border border-border bg-surface" key={group.name} open>
              <summary className="cursor-pointer px-4 py-3 font-medium">
                {group.name} — {group.stickers.length}
              </summary>
              <div className="border-t border-border p-3">
                <StickerList stickers={group.stickers} />
              </div>
            </details>
          ))
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Repetidas</h2>
        {view.duplicates.length === 0 ? (
          <p className="rounded border border-border bg-surface p-4 text-muted">Sin repetidas</p>
        ) : (
          view.duplicates.map((group) => (
            <details className="rounded border border-border bg-surface" key={group.name} open>
              <summary className="cursor-pointer px-4 py-3 font-medium">
                {group.name} — {group.stickers.length}
              </summary>
              <ul className="grid grid-cols-2 gap-2 border-t border-border p-3 sm:grid-cols-3 lg:grid-cols-4">
                {group.stickers.map((sticker) => (
                  <li className="min-w-0 rounded border border-border bg-surface p-2" key={sticker.code}>
                    <code className="block truncate text-sm font-semibold" title={sticker.code}>{sticker.code}</code>
                    {sticker.name ? <span className="block truncate text-xs text-muted" title={sticker.name}>{sticker.name}</span> : null}
                    <span className="mt-1 block text-xs font-medium text-primary">
                      {sticker.duplicates} {sticker.duplicates === 1 ? "repetida" : "repetidas"}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          ))
        )}
      </section>
    </section>
  );
}
