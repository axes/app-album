import type { Progress } from "@/lib/collection/service";
import { AlbumProgress } from "./album-progress";

/** The single visible source of collection progress figures on detail pages. */
export function CollectionSummary({ progress }: { progress: Progress }) {
  return (
    <section aria-label="Resumen de la colección">
      <AlbumProgress detailed progress={progress} />
    </section>
  );
}
