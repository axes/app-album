import { redirect } from "next/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/lib/auth/current-user";
import { DrizzleCollectionRepository } from "@/lib/collection/drizzle-repository";
import { CollectionService } from "@/lib/collection/service";
import { AlbumCard } from "@/components/albums/album-card";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function editorialSubtitle(publisher: string | null, year: number | null): string | null {
  if (publisher && year) return `${publisher} · ${year}`;
  if (publisher) return publisher;
  if (year) return `${year}`;
  return null;
}

export default async function AlbumsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const albums = await new CollectionService(new DrizzleCollectionRepository()).listPublishedAlbums(user.id);

  return (
    <section className="flex flex-col gap-6">
      <PageHeader
        title="Explorar álbumes"
        description="Álbumes publicados disponibles para tu colección."
      />
      {albums.length === 0 ? (
        <EmptyState title="No hay álbumes publicados disponibles." />
      ) : (
        <ul
          aria-label="Álbumes disponibles"
          className="grid animate-enter grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {albums.map((album) => (
            <li key={album.id} className="flex">
              <AlbumCard
                title={album.title}
                subtitle={editorialSubtitle(album.publisher, album.year)}
                meta={`${album.stickerCount} láminas`}
                progress={{
                  total: album.stickerCount,
                  owned: 0,
                  missing: album.stickerCount,
                  duplicates: 0,
                  percentage: 0,
                }}
                coverUrl={album.coverUrl}
                action={
                  album.userAlbumId
                    ? { kind: "in-collection", href: `/app/albums/${album.userAlbumId}` }
                    : { kind: "add", albumId: album.id }
                }
                className="w-full"
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}