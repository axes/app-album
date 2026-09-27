"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isActiveAdmin } from "@/lib/admin/authorization";
import { DrizzleCatalogRepository } from "@/lib/catalog/drizzle-repository";
import { CatalogError, CatalogService, buildSectionRange, buildStickerRange, parseStickerCodeList } from "@/lib/catalog/service";

export type CatalogActionState = { error?: string; success?: string };
const unauthorized = "No tienes autorización para realizar esta operación.";

function message(error: unknown) {
  if (error instanceof CatalogError) {
    const messages: Record<string, string> = {
      invalid_input: "Revisa los datos ingresados.",
      forbidden: unauthorized,
      not_found: "El elemento ya no existe.",
      duplicate_code: "Ese código ya existe en el álbum.",
      invalid_section: "La página seleccionada no pertenece al álbum.",
      publication_incomplete: "Para publicar se necesita al menos una página y una lámina.",
      published_delete: "Un álbum publicado no puede eliminarse. Primero vuelve a borrador.",
      album_not_empty: "El álbum debe estar vacío antes de eliminarlo.",
      bulk_limit_exceeded: "La operación supera el máximo permitido por vez.",
      duplicate_in_input: "Hay códigos repetidos en la lista ingresada.",
      invalid_range: "El rango ingresado no es válido.",
    };
    return messages[error.code] ?? "No se pudo completar la operación.";
  }
  return "No se pudo completar la operación.";
}

async function context() {
  const user = await getCurrentUser();
  if (!isActiveAdmin(user)) return null;
  return { actorId: user.id, service: new CatalogService(new DrizzleCatalogRepository()) };
}

function albumInput(formData: FormData) {
  return {
    title: formData.get("title"), description: formData.get("description"),
    publisher: formData.get("publisher"), year: formData.get("year"),
    coverUrl: formData.get("coverUrl"),
  };
}

function refresh(albumId?: FormDataEntryValue | null) {
  revalidatePath("/admin/albums");
  if (typeof albumId === "string") revalidatePath(`/admin/albums/${albumId}`);
}

export async function createAlbumAction(_state: CatalogActionState, formData: FormData): Promise<CatalogActionState> {
  const ctx = await context(); if (!ctx) return { error: unauthorized };
  let id: string;
  try { id = await ctx.service.createAlbum(ctx.actorId, albumInput(formData)); }
  catch (error) { return { error: message(error) }; }
  redirect(`/admin/albums/${id}`);
}

export async function updateAlbumAction(_state: CatalogActionState, formData: FormData): Promise<CatalogActionState> {
  const ctx = await context(); if (!ctx) return { error: unauthorized };
  try { await ctx.service.updateAlbum(ctx.actorId, formData.get("albumId"), albumInput(formData)); refresh(formData.get("albumId")); return { success: "Álbum actualizado." }; }
  catch (error) { return { error: message(error) }; }
}

export async function changeAlbumStatusAction(_state: CatalogActionState, formData: FormData): Promise<CatalogActionState> {
  const ctx = await context(); if (!ctx) return { error: unauthorized };
  try { await ctx.service.changeStatus(ctx.actorId, formData.get("albumId"), formData.get("status")); refresh(formData.get("albumId")); return { success: "Estado actualizado." }; }
  catch (error) { return { error: message(error) }; }
}

export async function deleteAlbumAction(_state: CatalogActionState, formData: FormData): Promise<CatalogActionState> {
  const ctx = await context(); if (!ctx) return { error: unauthorized };
  try { await ctx.service.deleteAlbum(ctx.actorId, formData.get("albumId")); }
  catch (error) { return { error: message(error) }; }
  revalidatePath("/admin/albums"); redirect("/admin/albums");
}

async function run(formData: FormData, callback: (ctx: NonNullable<Awaited<ReturnType<typeof context>>>) => Promise<void>, success: string): Promise<CatalogActionState> {
  const ctx = await context(); if (!ctx) return { error: unauthorized };
  try { await callback(ctx); refresh(formData.get("albumId")); return { success }; }
  catch (error) { return { error: message(error) }; }
}

export async function createSectionAction(_state: CatalogActionState, f: FormData) { return run(f, (c) => c.service.createSection(c.actorId, f.get("albumId"), f.get("name")), "Página creada."); }
export async function renameSectionAction(_state: CatalogActionState, f: FormData) { return run(f, (c) => c.service.renameSection(c.actorId, f.get("albumId"), f.get("sectionId"), f.get("name")), "Página actualizada."); }
export async function moveSectionAction(_state: CatalogActionState, f: FormData) { return run(f, (c) => c.service.moveSection(c.actorId, f.get("albumId"), f.get("sectionId"), f.get("direction")), "Orden actualizado."); }
export async function deleteSectionAction(_state: CatalogActionState, f: FormData) { return run(f, (c) => c.service.deleteSection(c.actorId, f.get("albumId"), f.get("sectionId")), "Página eliminada. Las láminas quedaron sin página asignada."); }
export async function createStickerAction(_state: CatalogActionState, f: FormData) { return run(f, (c) => c.service.createSticker(c.actorId, f.get("albumId"), { code: f.get("code"), name: f.get("name"), sectionId: f.get("sectionId") }), "Lámina creada."); }
export async function updateStickerAction(_state: CatalogActionState, f: FormData) { return run(f, (c) => c.service.updateSticker(c.actorId, f.get("albumId"), f.get("stickerId"), { code: f.get("code"), name: f.get("name"), sectionId: f.get("sectionId") }), "Lámina actualizada."); }
export async function moveStickerAction(_state: CatalogActionState, f: FormData) { return run(f, (c) => c.service.moveSticker(c.actorId, f.get("albumId"), f.get("stickerId"), f.get("direction")), "Orden actualizado."); }
export async function deleteStickerAction(_state: CatalogActionState, f: FormData) { return run(f, (c) => c.service.deleteSticker(c.actorId, f.get("albumId"), f.get("stickerId")), "Lámina eliminada."); }

export async function createStickerRangeAction(_state: CatalogActionState, f: FormData) {
  const ctx = await context(); if (!ctx) return { error: unauthorized };
  try {
    const codes = buildStickerRange(f.get("start"), f.get("end"), f.get("prefix"));
    const created = await ctx.service.createStickers(ctx.actorId, f.get("albumId"), {
      codes, name: f.get("name"), sectionId: f.get("sectionId"),
    });
    refresh(f.get("albumId"));
    return { success: `${created} láminas creadas.` };
  } catch (error) { return { error: message(error) }; }
}

export async function createStickerListAction(_state: CatalogActionState, f: FormData) {
  const ctx = await context(); if (!ctx) return { error: unauthorized };
  try {
    const codes = parseStickerCodeList(f.get("codes"));
    const created = await ctx.service.createStickers(ctx.actorId, f.get("albumId"), {
      codes, name: f.get("name"), sectionId: f.get("sectionId"),
    });
    refresh(f.get("albumId"));
    return { success: `${created} láminas creadas.` };
  } catch (error) { return { error: message(error) }; }
}

export async function createSectionRangeAction(_state: CatalogActionState, f: FormData) {
  const ctx = await context(); if (!ctx) return { error: unauthorized };
  try {
    const names = buildSectionRange(f.get("base"), f.get("start"), f.get("end"));
    const created = await ctx.service.createSections(ctx.actorId, f.get("albumId"), names);
    refresh(f.get("albumId"));
    return { success: `${created} páginas creadas.` };
  } catch (error) { return { error: message(error) }; }
}
