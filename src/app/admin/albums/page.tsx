import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { DrizzleCatalogRepository } from "@/lib/catalog/drizzle-repository";
import { CatalogService } from "@/lib/catalog/service";

export default async function AdminAlbumsPage() {
  const albums = await new CatalogService(new DrizzleCatalogRepository()).listAlbums();
  return (
    <section className="flex flex-col gap-5">
      <PageHeader
        title="Álbumes"
        actions={(
          <Button asChild>
            <Link href="/admin/albums/new">Crear álbum</Link>
          </Button>
        )}
      />
      <div className="overflow-x-auto rounded border border-border bg-surface">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="p-2">Título</th>
              <th className="p-2">Estado</th>
              <th className="p-2">Editorial / año</th>
              <th className="p-2 text-right">Páginas</th>
              <th className="p-2 text-right">Láminas</th>
              <th className="p-2 text-right">En colección</th>
            </tr>
          </thead>
          <tbody>
            {albums.map((album) => (
              <tr className="border-b border-border last:border-b-0" key={album.id}>
                <td className="p-2">
                  <Link className="font-medium text-primary underline" href={`/admin/albums/${album.id}`}>
                    {album.title}
                  </Link>
                  <div className="text-xs text-muted">{album.slug}</div>
                </td>
                <td className="p-2">
                  <span
                    className={`rounded border px-2 py-1 text-xs ${album.status === "published" ? "border-success text-success" : "border-border bg-surface-muted text-muted"}`}
                  >
                    {album.status === "published" ? "Publicado" : "Borrador"}
                  </span>
                </td>
                <td className="p-2">{[album.publisher, album.year].filter(Boolean).join(" · ") || "—"}</td>
                <td className="p-2 text-right tabular-nums">{album.sectionCount}</td>
                <td className="p-2 text-right tabular-nums">{album.stickerCount}</td>
                <td className="p-2 text-right tabular-nums">{album.collectionCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
