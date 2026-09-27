import Link from "next/link";
import { DrizzleCatalogRepository } from "@/lib/catalog/drizzle-repository";
import { CatalogService } from "@/lib/catalog/service";

export default async function AdminAlbumsPage() {
  const albums = await new CatalogService(new DrizzleCatalogRepository()).listAlbums();
  return (
    <section className="flex flex-col gap-5">
      <nav className="flex gap-4 text-sm">
        <Link className="text-primary underline" href="/app">← Área protegida</Link>
        <Link className="text-primary underline" href="/admin/users">Usuarios</Link>
      </nav>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Álbumes</h1>
        <Link className="rounded bg-primary px-4 py-2 text-primary-text" href="/admin/albums/new">
          Crear álbum
        </Link>
      </div>
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
