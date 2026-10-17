import { AlbumCover } from "@/components/albums/album-cover";
import { CollectionSummary } from "@/components/albums/collection-summary";
import type { UserAlbumDetail } from "@/lib/collection/service";
import { RemoveAlbumButton } from "../remove-button";
import { ShareControls } from "./share-controls";

type AlbumDetailHeroProps = Pick<UserAlbumDetail, "album" | "id" | "progress" | "sharing">;

/** Open editorial composition for the collection identity and its actions. */
export function AlbumDetailHero({ album, id, progress, sharing }: AlbumDetailHeroProps) {
  const metadata = [album.publisher, album.year].filter(Boolean).join(" · ") || "Sin datos editoriales";

  return (
    <header className="grid gap-5 border-b border-border pb-6 sm:grid-cols-[10rem_minmax(0,1fr)] sm:gap-6">
      <div className="mx-auto w-full max-w-[10rem] sm:mx-0">
        <AlbumCover coverUrl={album.coverUrl} title={album.title} />
      </div>
      <div className="flex min-w-0 flex-col gap-5">
        <div className="min-w-0">
          <p className="type-label text-primary">Álbum</p>
          <h1 className="mt-1 break-words text-content">{album.title}</h1>
          <p className="type-small mt-1 text-muted">{metadata}</p>
        </div>
        <CollectionSummary progress={progress} />
        <ShareControls sharing={sharing} userAlbumId={id} />
        <div className="flex w-full border-t border-border pt-4 sm:justify-end [&>button]:w-full sm:[&>button]:w-auto">
          <RemoveAlbumButton userAlbumId={id} />
        </div>
      </div>
    </header>
  );
}
