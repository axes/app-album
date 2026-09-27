import Link from "next/link";
import { redirect } from "next/navigation";
import { AlbumCover } from "@/app/admin/albums/album-cover";
import { getCurrentUser } from "@/lib/auth/current-user";
import { DrizzleCollectionRepository } from "@/lib/collection/drizzle-repository";
import { CollectionService } from "@/lib/collection/service";
import { CollectionNav } from "../collection-nav";
import { AddAlbumButton } from "./add-button";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AlbumsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const albums = await new CollectionService(new DrizzleCollectionRepository()).listPublishedAlbums(user.id);

  return (
    <section className="flex flex-col gap-6">
      <CollectionNav user={user} />
      <div>
        <h1 className="text-2xl font-semibold">Explorar álbumes</h1>
        <p className="mt-1 text-sm text-muted">Álbumes publicados disponibles para tu colección.</p>
      </div>
      {albums.length === 0 ? (
        <p className="rounded border border-border bg-surface p-6 text-muted">No hay álbumes publicados disponibles.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => (
            <article className="flex gap-4 rounded border border-border bg-surface p-4 sm:flex-col" key={album.id}>
              <div className="w-24 shrink-0 sm:w-full">
                <AlbumCover title={album.title} url={album.coverUrl} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div>
                  <h2 className="font-semibold">{album.title}</h2>
                  <p className="text-sm text-muted">{[album.publisher, album.year].filter(Boolean).join(" · ") || "Sin datos editoriales"}</p>
                  <p className="mt-1 text-sm tabular-nums">{album.stickerCount} láminas</p>
                </div>
                {album.userAlbumId ? (
                  <div className="mt-auto flex flex-col items-start gap-2">
                    <span className="rounded border border-success px-2 py-1 text-xs text-success">En mi colección</span>
                    <Link className="text-primary underline" href={`/app/albums/${album.userAlbumId}`}>Abrir álbum</Link>
                  </div>
                ) : <AddAlbumButton albumId={album.id} />}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
