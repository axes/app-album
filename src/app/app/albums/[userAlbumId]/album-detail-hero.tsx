import { AlbumCover } from "@/components/albums/album-cover";
import { CollectionSummary } from "@/components/albums/collection-summary";
import type { UserAlbumDetail } from "@/lib/collection/service";
import { RemoveAlbumButton } from "../remove-button";
import { AlbumCompletedMessage, AlbumCoverFrame } from "./album-completion";
import { AlbumOptions } from "./album-options";
import { ShareControls } from "./share-controls";

type AlbumDetailHeroProps = Pick<UserAlbumDetail, "album" | "id" | "progress" | "sharing">;

/**
 * Compact identity block for the collection.
 *
 * The cover stays small and sits beside the title and progress at every
 * width, and the occasional actions (sharing, removal) live in a collapsed
 * `AlbumOptions` disclosure, so the sticker grid — the primary task — starts
 * within the first screen on a phone.
 */
export function AlbumDetailHero({ album, id, progress, sharing }: AlbumDetailHeroProps) {
  const complete = progress.total > 0 && progress.missing === 0;
  const metadata = [album.publisher, album.year].filter(Boolean).join(" · ") || "Sin datos editoriales";

  return (
    <header className="flex flex-col gap-3 border-b border-border pb-4">
      <div className="grid grid-cols-[4.5rem_minmax(0,1fr)] items-start gap-4 sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-6">
        <div className="album-detail-cover w-full">
          <AlbumCoverFrame complete={complete}>
            <AlbumCover coverUrl={album.coverUrl} title={album.title} />
          </AlbumCoverFrame>
        </div>
        <div className="flex min-w-0 flex-col gap-4">
          <div className="min-w-0">
            <p className="type-label text-primary">Álbum</p>
            <h1 className="mt-1 break-words text-content">{album.title}</h1>
            <p className="type-small mt-1 text-muted">{metadata}</p>
            <AlbumCompletedMessage complete={complete} />
          </div>
          <CollectionSummary progress={progress} />
        </div>
      </div>
      <AlbumOptions defaultOpen={sharing.enabled}>
        <ShareControls sharing={sharing} userAlbumId={id} />
        <div className="flex w-full border-t border-border pt-4 sm:justify-end [&>button]:w-full sm:[&>button]:w-auto">
          <RemoveAlbumButton userAlbumId={id} />
        </div>
      </AlbumOptions>
    </header>
  );
}
