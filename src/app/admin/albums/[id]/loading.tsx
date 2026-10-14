import { LoadingRegion, Skeleton } from "@/components/ui/skeleton";

/**
 * UI-06A — route-level loading boundary for `/admin/albums/[id]`.
 *
 * The catalog detail page resolves the album, its pages and every sticker, then
 * renders three stacked cards (Álbum, Páginas, Láminas). The boundary mirrors
 * that stack so the swap to real content does not move the page.
 *
 * It overrides the `/admin` boundary, which only knows about the list tables.
 */
const PAGE_ROWS = 4;
const STICKER_ROWS = 6;

export default function AdminAlbumLoading() {
  return (
    <LoadingRegion label="Cargando el álbum">
      <section className="flex flex-col gap-6">
        <Skeleton className="h-4 w-24" />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-7 w-24 rounded" />
        </div>

        <div className="flex flex-col gap-3 rounded border border-border bg-surface p-4">
          <Skeleton className="h-5 w-24" />
          <div className="grid items-start gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
            <Skeleton className="aspect-[3/4] w-full rounded" />
            <div className="grid gap-2 sm:grid-cols-2">
              {Array.from({ length: 4 }, (_, index) => (
                <div className="flex flex-col gap-1" key={index}>
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded border border-border bg-surface p-4">
          <Skeleton className="h-5 w-24" />
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full border-collapse text-left text-sm">
              <tbody>
                {Array.from({ length: PAGE_ROWS }, (_, index) => (
                  <tr className="border-b border-border last:border-b-0" key={index}>
                    <td className="w-16 px-3 py-2"><Skeleton className="h-4 w-8" /></td>
                    <td className="px-3 py-2"><Skeleton className="h-4 w-40" /></td>
                    <td className="w-28 px-3 py-2"><Skeleton className="h-4 w-10" /></td>
                    <td className="w-64 px-3 py-2"><Skeleton className="h-6 w-32" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-3 rounded border border-border bg-surface p-4">
          <Skeleton className="h-5 w-24" />
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full border-collapse text-left text-sm">
              <tbody>
                {Array.from({ length: STICKER_ROWS }, (_, index) => (
                  <tr className="border-b border-border last:border-b-0" key={index}>
                    <td className="px-3 py-2"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-3 py-2"><Skeleton className="h-4 w-40" /></td>
                    <td className="px-3 py-2"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-3 py-2"><Skeleton className="h-6 w-28" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </LoadingRegion>
  );
}
