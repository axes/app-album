"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DataTable,
  DataTableBody,
  DataTableCell,
  DataTableHead,
  DataTableHeaderCell,
  DataTableRow,
} from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Icon } from "@/components/ui/icons";
import type { AlbumSummary } from "@/lib/catalog/service";

export type AdminAlbumListProps = {
  albums: AlbumSummary[];
};

function searchableText(album: AlbumSummary) {
  return [album.title, album.slug, album.publisher, album.year]
    .filter((value) => value !== null && value !== undefined)
    .join(" ")
    .toLocaleLowerCase("es-CL");
}

export function AdminAlbumList({ albums }: AdminAlbumListProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("es-CL");
  const filteredAlbums = useMemo(
    () =>
      normalizedQuery
        ? albums.filter((album) => searchableText(album).includes(normalizedQuery))
        : albums,
    [albums, normalizedQuery],
  );

  if (albums.length === 0) {
    return <EmptyState title="Todavía no hay álbumes" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="max-w-md">
        <Field
          label="Buscar álbum"
          name="album-search"
          icon="explore"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <p role="status" aria-live="polite" className="text-sm tabular-nums text-muted">
        {filteredAlbums.length} {filteredAlbums.length === 1 ? "resultado" : "resultados"}
      </p>

      {filteredAlbums.length === 0 ? (
        <EmptyState
          title="No encontramos álbumes"
          description="Prueba con otro título, slug, editorial o año."
          icon={<Icon name="explore" size="lg" />}
          action={(
            <Button variant="secondary" onClick={() => setQuery("")}>
              Limpiar búsqueda
            </Button>
          )}
        />
      ) : (
        <DataTable ariaLabel="Álbumes" minWidth="56rem" className="bg-surface">
          <DataTableHead>
            <DataTableRow>
              <DataTableHeaderCell>Título</DataTableHeaderCell>
              <DataTableHeaderCell>Estado</DataTableHeaderCell>
              <DataTableHeaderCell>Editorial / año</DataTableHeaderCell>
              <DataTableHeaderCell className="text-right">Páginas</DataTableHeaderCell>
              <DataTableHeaderCell className="text-right">Láminas</DataTableHeaderCell>
              <DataTableHeaderCell className="text-right">En colección</DataTableHeaderCell>
              <DataTableHeaderCell className="text-right">Acciones</DataTableHeaderCell>
            </DataTableRow>
          </DataTableHead>
          <DataTableBody>
            {filteredAlbums.map((album) => (
              <DataTableRow className="last:border-b-0" key={album.id}>
                <DataTableCell>
                  <div className="font-semibold text-content">{album.title}</div>
                  <div className="text-xs text-muted">{album.slug}</div>
                </DataTableCell>
                <DataTableCell>
                  <Badge variant={album.status === "published" ? "success" : "neutral"}>
                    {album.status === "published" ? "Publicado" : "Borrador"}
                  </Badge>
                </DataTableCell>
                <DataTableCell>
                  {[album.publisher, album.year].filter(Boolean).join(" · ") || "—"}
                </DataTableCell>
                <DataTableCell className="text-right tabular-nums">
                  {album.sectionCount}
                </DataTableCell>
                <DataTableCell className="text-right tabular-nums">
                  {album.stickerCount}
                </DataTableCell>
                <DataTableCell className="text-right tabular-nums">
                  {album.collectionCount}
                </DataTableCell>
                <DataTableCell className="text-right">
                  <Button
                    asChild
                    size="sm"
                    variant="secondary"
                    aria-label={`Editar ${album.title}`}
                    icon={<Icon name="pencil" size="sm" />}
                  >
                    <Link href={`/admin/albums/${album.id}`}>Editar</Link>
                  </Button>
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  );
}
