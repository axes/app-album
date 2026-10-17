import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icons";
import { PageHeader } from "@/components/ui/page-header";
import { DrizzleCatalogRepository } from "@/lib/catalog/drizzle-repository";
import { CatalogService } from "@/lib/catalog/service";
import { AdminAlbumList } from "./album-list";

export default async function AdminAlbumsPage() {
  const albums = await new CatalogService(new DrizzleCatalogRepository()).listAlbums();
  return (
    <section className="flex flex-col gap-5">
      <PageHeader
        title="Álbumes"
        metadata={`${albums.length} ${albums.length === 1 ? "álbum" : "álbumes"}`}
        actions={(
          <Button asChild icon={<Icon name="add" size="md" />}>
            <Link href="/admin/albums/new">Crear álbum</Link>
          </Button>
        )}
      />
      <AdminAlbumList albums={albums} />
    </section>
  );
}
