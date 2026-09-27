import Link from "next/link";
import { notFound } from "next/navigation";
import { DrizzleCatalogRepository } from "@/lib/catalog/drizzle-repository";
import { CatalogError, CatalogService, type Sticker } from "@/lib/catalog/service";
import { ActionForm, Card, Collapsible } from "../action-form";
import { AlbumActions } from "../album-actions";
import { AlbumCover } from "../album-cover";
import { AlbumForm } from "../album-form";
import { DeletePageForm } from "../delete-page-form";
import { InlinePageName } from "../inline-page-name";
import { StickerTable } from "../sticker-table";
import {
  createSectionAction,
  createSectionRangeAction,
  createStickerAction,
  createStickerListAction,
  createStickerRangeAction,
  moveSectionAction,
} from "../actions";

const field = "rounded border border-input-border bg-input px-2 py-1 text-sm text-content";
const button =
  "rounded border border-border bg-surface px-2 py-1 text-sm text-content hover:bg-surface-muted";

function StatusBadge({ status }: { status: "draft" | "published" }) {
  const published = status === "published";
  return (
    <span
      className={`rounded border px-2 py-1 text-xs ${published ? "border-success text-success" : "border-border bg-surface-muted text-muted"}`}
    >
      {published ? "Publicado" : "Borrador"}
    </span>
  );
}

function PageSelect({
  pages,
  label,
  name = "sectionId",
}: {
  pages: { id: string; name: string }[];
  label: string;
  name?: string;
}) {
  return (
    <select className={field} name={name} aria-label={label}>
      <option value="">Sin página asignada</option>
      {pages.map((page) => (
        <option key={page.id} value={page.id}>
          {page.name}
        </option>
      ))}
    </select>
  );
}

export default async function AlbumPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let album;
  try {
    album = await new CatalogService(new DrizzleCatalogRepository()).getAlbum(id);
  } catch (error) {
    if (error instanceof CatalogError && error.code === "invalid_input") notFound();
    throw error;
  }
  if (!album) notFound();

  const pages = album.sections.map((section) => ({ id: section.id, name: section.name }));
  const stickersByPage = new Map<string, Sticker[]>();
  const unassigned: Sticker[] = [];
  for (const sticker of album.stickers) {
    if (sticker.sectionId) {
      const bucket = stickersByPage.get(sticker.sectionId) ?? [];
      bucket.push(sticker);
      stickersByPage.set(sticker.sectionId, bucket);
    } else {
      unassigned.push(sticker);
    }
  }

  return (
    <section className="flex flex-col gap-6">
      <nav className="flex gap-4 text-sm">
        <Link className="text-primary underline" href="/admin/albums">← Álbumes</Link>
        <Link className="text-primary underline" href="/admin/users">Usuarios</Link>
      </nav>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{album.title}</h1>
          <p className="text-sm text-muted">
            /{album.slug} · {album.sectionCount} páginas · {album.stickerCount} láminas
          </p>
        </div>
        <StatusBadge status={album.status} />
      </header>

      <AlbumActions albumId={album.id} status={album.status} />

      {/* CARD 1 — ÁLBUM */}
      <Card
        title="Álbum"
        subtitle={`${album.title} · ${album.status === "published" ? "Publicado" : "Borrador"}`}
        actions={<StatusBadge status={album.status} />}
      >
        <div className="grid items-start gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <AlbumCover url={album.coverUrl} title={album.title} />
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted">Título</dt>
              <dd className="font-medium">{album.title}</dd>
            </div>
            <div>
              <dt className="text-muted">Estado</dt>
              <dd>{album.status === "published" ? "Publicado" : "Borrador"}</dd>
            </div>
            <div>
              <dt className="text-muted">Editorial</dt>
              <dd>{album.publisher ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted">Año</dt>
              <dd>{album.year ?? "—"}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-muted">Descripción</dt>
              <dd className="whitespace-pre-wrap">{album.description ?? "—"}</dd>
            </div>
          </dl>
        </div>
        <Collapsible title="Editar información">
          <AlbumForm album={album} />
        </Collapsible>
      </Card>

      {/* CARD 2 — PÁGINAS */}
      <Card
        title="Páginas"
        subtitle={`${album.sections.length} ${album.sections.length === 1 ? "página" : "páginas"} · ${album.stickers.length - unassigned.length} láminas asignadas`}
      >
        <div className="grid gap-3 lg:grid-cols-2">
          <Collapsible title="Crear una página">
            <ActionForm action={createSectionAction} className="grid gap-2">
              <input type="hidden" name="albumId" value={album.id} />
              <input
                className={field}
                name="name"
                required
                maxLength={160}
                placeholder="Nombre de la página"
              />
              <button className={button}>Crear página</button>
            </ActionForm>
          </Collapsible>

          <Collapsible title="Crear páginas por rango">
            <ActionForm action={createSectionRangeAction} className="grid gap-2">
              <input type="hidden" name="albumId" value={album.id} />
              <input
                className={field}
                name="base"
                required
                maxLength={150}
                placeholder="Nombre base (ej. Página)"
              />
              <div className="flex gap-2">
                <input
                  className={field}
                  name="start"
                  type="number"
                  min={0}
                  required
                  placeholder="Desde"
                  aria-label="Desde"
                />
                <input
                  className={field}
                  name="end"
                  type="number"
                  min={0}
                  required
                  placeholder="Hasta"
                  aria-label="Hasta"
                />
              </div>
              <button className={button}>Crear rango</button>
            </ActionForm>
          </Collapsible>
        </div>

        {album.sections.length === 0 ? (
          <p className="text-sm text-muted">Todavía no hay páginas.</p>
        ) : (
          <div className="overflow-x-auto rounded border border-border">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-muted text-xs uppercase tracking-wide text-muted">
                  <th className="w-16 px-3 py-2 font-medium">Orden</th>
                  <th className="px-3 py-2 font-medium">Nombre</th>
                  <th className="w-28 px-3 py-2 font-medium">Láminas</th>
                  <th className="w-64 px-3 py-2 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {album.sections.map((section, index) => {
                  const count = stickersByPage.get(section.id)?.length ?? 0;
                  return (
                    <tr className="group/row border-b border-border hover:bg-surface-muted last:border-b-0" key={section.id}>
                      <td className="px-3 py-1.5 text-xs text-muted">#{section.position}</td>
                      <td className="px-3 py-1.5">
                        <InlinePageName
                          albumId={album.id}
                          pageId={section.id}
                          name={section.name}
                        />
                      </td>
                      <td className="px-3 py-1.5 text-xs text-muted">{count}</td>
                      <td className="px-3 py-1.5">
                        <div className="flex flex-wrap items-center gap-1">
                          <ActionForm action={moveSectionAction} className="inline">
                            <input type="hidden" name="albumId" value={album.id} />
                            <input type="hidden" name="sectionId" value={section.id} />
                            <input type="hidden" name="direction" value="up" />
                            <button
                              className={button}
                              disabled={index === 0}
                              aria-label={`Subir página ${section.name}`}
                            >
                              ↑
                            </button>
                          </ActionForm>
                          <ActionForm action={moveSectionAction} className="inline">
                            <input type="hidden" name="albumId" value={album.id} />
                            <input type="hidden" name="sectionId" value={section.id} />
                            <input type="hidden" name="direction" value="down" />
                            <button
                              className={button}
                              disabled={index === album.sections.length - 1}
                              aria-label={`Bajar página ${section.name}`}
                            >
                              ↓
                            </button>
                          </ActionForm>
                          <DeletePageForm
                            albumId={album.id}
                            sectionId={section.id}
                            sectionName={section.name}
                            stickerCount={count}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* CARD 3 — LÁMINAS */}
      <Card
        title="Láminas"
        subtitle={`${album.stickers.length} ${album.stickers.length === 1 ? "lámina" : "láminas"} · ${unassigned.length} sin página asignada`}
        defaultOpen
      >
        <div className="grid gap-3 lg:grid-cols-3">
          <Collapsible title="Crear una lámina">
            <ActionForm action={createStickerAction} className="grid gap-2">
              <input type="hidden" name="albumId" value={album.id} />
              <input
                className={field}
                name="code"
                required
                maxLength={64}
                placeholder="Código (ej. A1 o ESP-01)"
              />
              <input className={field} name="name" maxLength={160} placeholder="Nombre opcional" />
              <PageSelect pages={pages} label="Página destino" />
              <button className={button}>Crear lámina</button>
            </ActionForm>
          </Collapsible>

          <Collapsible title="Crear por rango">
            <ActionForm action={createStickerRangeAction} className="grid gap-2">
              <input type="hidden" name="albumId" value={album.id} />
              <PageSelect pages={pages} label="Página destino" />
              <div className="flex gap-2">
                <input
                  className={field}
                  name="start"
                  type="number"
                  min={0}
                  required
                  placeholder="Inicio"
                  aria-label="Inicio"
                />
                <input
                  className={field}
                  name="end"
                  type="number"
                  min={0}
                  required
                  placeholder="Fin"
                  aria-label="Fin"
                />
              </div>
              <input
                className={field}
                name="prefix"
                maxLength={32}
                placeholder="Prefijo opcional (ej. A)"
              />
              <input className={field} name="name" maxLength={160} placeholder="Nombre opcional" />
              <button className={button}>Crear rango</button>
            </ActionForm>
          </Collapsible>

          <Collapsible title="Crear por lista de códigos">
            <ActionForm action={createStickerListAction} className="grid gap-2">
              <input type="hidden" name="albumId" value={album.id} />
              <PageSelect pages={pages} label="Página destino" />
              <textarea
                className={field}
                name="codes"
                rows={5}
                required
                placeholder={"A1\nA2\nESP-01\nLOGO"}
              />
              <input className={field} name="name" maxLength={160} placeholder="Nombre opcional" />
              <button className={button}>Crear lista</button>
            </ActionForm>
          </Collapsible>
        </div>

        {album.stickers.length === 0 ? (
          <p className="text-sm text-muted">Todavía no hay láminas.</p>
        ) : (
          <StickerTable albumId={album.id} stickers={album.stickers} pages={pages} />
        )}

        {unassigned.length > 0 ? (
          <p className="text-xs text-muted">
            {unassigned.length} {unassigned.length === 1 ? "lámina" : "láminas"} sin página asignada.
          </p>
        ) : null}
      </Card>

      <AlbumActions albumId={album.id} status={album.status} />
    </section>
  );
}
