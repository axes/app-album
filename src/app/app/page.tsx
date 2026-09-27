import Link from "next/link";
import { redirect } from "next/navigation";
import { AlbumCover } from "@/app/admin/albums/album-cover";
import { getCurrentUser } from "@/lib/auth/current-user";
import { DrizzleCollectionRepository } from "@/lib/collection/drizzle-repository";
import { CollectionService } from "@/lib/collection/service";
import { CollectionNav } from "./collection-nav";
import { ProgressSummary } from "./progress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AppPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const albums = await new CollectionService(new DrizzleCollectionRepository()).listAlbumsForOwner(user.id);

  return (
    <section className="flex flex-col gap-6">
      <CollectionNav user={user} />
      <div>
        <h1 className="text-2xl font-semibold">Mis álbumes</h1>
        <p className="mt-1 text-sm text-muted">Colección de {user.username}</p>
      </div>
      {albums.length === 0 ? (
        <div className="rounded border border-border bg-surface p-6 text-center">
          <p>Todavía no tienes álbumes en tu colección.</p>
          <Link className="mt-4 inline-block rounded bg-primary px-4 py-2 text-primary-text" href="/app/albums">
            Explorar álbumes
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((entry) => (
            <article className="flex gap-4 rounded border border-border bg-surface p-4 sm:flex-col" key={entry.id}>
              <div className="w-24 shrink-0 sm:w-full">
                <AlbumCover title={entry.album.title} url={entry.album.coverUrl} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div>
                  <h2 className="font-semibold">{entry.album.title}</h2>
                  <p className="text-sm text-muted">
                    {[entry.album.publisher, entry.album.year].filter(Boolean).join(" · ") || "Sin datos editoriales"}
                  </p>
                </div>
                <ProgressSummary progress={entry.progress} />
                <Link className="mt-auto text-primary underline" href={`/app/albums/${entry.id}`}>
                  Abrir álbum
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
