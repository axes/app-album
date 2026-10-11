import Link from "next/link";
import { redirect } from "next/navigation";
import { AlbumCover } from "@/app/admin/albums/album-cover";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getCurrentUser } from "@/lib/auth/current-user";
import { DrizzleCollectionRepository } from "@/lib/collection/drizzle-repository";
import { CollectionService } from "@/lib/collection/service";
import { ProgressSummary } from "./progress";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AppPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const albums = await new CollectionService(new DrizzleCollectionRepository()).listAlbumsForOwner(user.id);

  return (
    <section className="flex flex-col gap-6">
      <PageHeader title="Mis álbumes" description={`Colección de ${user.username}`} />
      {albums.length === 0 ? (
        <EmptyState
          title="Todavía no tienes álbumes en tu colección."
          action={(
            <Button asChild>
              <Link href="/app/albums">Explorar álbumes</Link>
            </Button>
          )}
        />
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
