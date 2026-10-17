import Link from "next/link";
import { Icon } from "@/components/ui/icons";
import { AlbumForm } from "../album-form";

export default function NewAlbumPage() {
  return (
    <section className="flex flex-col gap-5">
      <Link className="inline-flex items-center gap-1 text-sm text-primary underline" href="/admin/albums">
        <Icon name="back" size="sm" />
        Álbumes
      </Link>
      <h1 className="text-2xl font-semibold">Crear álbum</h1>
      <div className="rounded border border-border bg-surface p-4">
        <AlbumForm />
      </div>
    </section>
  );
}
