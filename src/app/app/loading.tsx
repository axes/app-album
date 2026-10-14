import { LoadingRegion, Skeleton } from "@/components/ui/skeleton";

/**
 * UI-06A — route-level loading boundary for `/app` and `/app/albums`.
 *
 * Both routes render a `PageHeader` followed by a responsive grid of
 * `AlbumCard`s, so one boundary covers them without a layout shift. The
 * geometry mirrors `AlbumCard`: a 3:4 cover capped at 10rem, two title lines,
 * one editorial line, a state badge, the progress block and the CTA.
 *
 * The boundary sits inside `src/app/app/layout.tsx`, so the authenticated shell
 * (header, navigation, mobile dock) stays painted while the data resolves.
 */
const CARD_COUNT = 6;

export default function AppLoading() {
  return (
    <LoadingRegion label="Cargando tus álbumes">
      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-64" />
        </div>
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: CARD_COUNT }, (_, index) => (
            <li className="flex" key={index}>
              <div className="flex h-full w-full max-w-xs flex-col gap-2 rounded-card border border-border bg-surface p-3">
                <div className="mx-auto w-full max-w-[10rem]">
                  <Skeleton className="aspect-[3/4] w-full rounded-card" />
                </div>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-5 w-20 rounded-pill" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </li>
          ))}
        </ul>
      </section>
    </LoadingRegion>
  );
}
