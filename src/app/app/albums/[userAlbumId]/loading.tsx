import { LoadingRegion, Skeleton } from "@/components/ui/skeleton";

/**
 * UI-06A — route-level loading boundary for `/app/albums/[userAlbumId]`.
 *
 * This is the heaviest authenticated route: it resolves the collection, its
 * pages and every sticker before it can render. The boundary mirrors the real
 * composition — the editorial hero (`AlbumDetailHero`) and the sticker mosaic
 * (`StickerCollection`) — so the swap to real content does not move the page.
 *
 * It overrides the `/app` boundary, which only knows about the album grid.
 */
const SECTION_COUNT = 2;
const STICKERS_PER_SECTION = 8;

export default function UserAlbumLoading() {
  return (
    <LoadingRegion label="Cargando el álbum">
      <section className="flex flex-col gap-6">
        <header className="grid gap-5 border-b border-border pb-6 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6">
          <div className="mx-auto w-full max-w-[10rem] sm:mx-0">
            <Skeleton className="aspect-[3/4] w-full rounded-card" />
          </div>
          <div className="flex min-w-0 flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-40" />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-10" />
              </div>
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-3 w-44" />
            </div>
            <Skeleton className="h-10 w-full sm:w-56" />
            <div className="flex w-full border-t border-border pt-4 sm:justify-end">
              <Skeleton className="h-10 w-full sm:w-40" />
            </div>
          </div>
        </header>

        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Skeleton className="h-7 w-28" />
            <Skeleton className="h-11 w-56 rounded-control" />
          </div>
          {Array.from({ length: SECTION_COUNT }, (_, sectionIndex) => (
            <div
              className="overflow-hidden rounded-card border border-border bg-surface"
              key={sectionIndex}
            >
              <div className="flex min-h-11 items-center justify-between gap-3 px-4 py-3">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="border-t border-border">
                <ul className="grid grid-cols-[repeat(auto-fill,minmax(7rem,1fr))] gap-3 p-3">
                  {Array.from({ length: STICKERS_PER_SECTION }, (_, stickerIndex) => (
                    <li
                      className="flex flex-col gap-2 rounded-sticker border border-border bg-surface-muted p-2.5"
                      key={stickerIndex}
                    >
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-11 w-full" />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </section>
      </section>
    </LoadingRegion>
  );
}
