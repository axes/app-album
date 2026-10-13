import { redirect } from "next/navigation";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/lib/auth/current-user";
import { DrizzleCollectionRepository } from "@/lib/collection/drizzle-repository";
import { CollectionService } from "@/lib/collection/service";
import { AlbumCard } from "@/components/albums/album-card";
import { EmptyLibrary } from "@/components/albums/empty-library";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function editorialSubtitle(publisher: string | null, year: number | null): string | null {
  if (publisher && year) return `${publisher} · ${year}`;
  if (publisher) return publisher;
  if (year) return `${year}`;
  return null;
}

export default async function AppPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const albums = await new CollectionService(new DrizzleCollectionRepository()).listAlbumsForOwner(user.id);

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Mis álbumes" description={`Colección de ${user.username}`} />
      {albums.length === 0 ? (
        <EmptyLibrary username={user.username} />
      ) : (
        <ul
          aria-label="Mis álbumes"
          className="grid animate-enter grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {albums.map((entry) => (
            <li key={entry.id} className="flex">
              <AlbumCard
                title={entry.album.title}
                subtitle={editorialSubtitle(entry.album.publisher, entry.album.year)}
                progress={entry.progress}
                coverUrl={entry.album.coverUrl}
                action={{ kind: "open", href: `/app/albums/${entry.id}`, label: "Abrir álbum" }}
                className="w-full"
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}