"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { DrizzleCollectionRepository } from "@/lib/collection/drizzle-repository";
import { CollectionError, CollectionService } from "@/lib/collection/service";

export type CollectionActionState = { error?: string };

function service() {
  return new CollectionService(new DrizzleCollectionRepository());
}

function message(error: unknown): string {
  if (error instanceof CollectionError) {
    const messages: Record<string, string> = {
      invalid_input: "La solicitud no es válida.",
      forbidden: "No tienes autorización para modificar esta colección.",
      not_found: "La colección o lámina ya no existe.",
      album_not_published: "Este álbum ya no está disponible para añadir.",
      sticker_not_in_album: "La lámina no pertenece a este álbum.",
      duplicate_collection: "Este álbum ya está en tu colección.",
      share_token_collision: "No se pudo generar un enlace público. Inténtalo de nuevo.",
    };
    return messages[error.code] ?? "No se pudo completar la operación.";
  }
  throw error;
}

export async function addAlbumAction(_state: CollectionActionState, formData: FormData): Promise<CollectionActionState> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  try {
    const collection = await service().addAlbum(user.id, formData.get("albumId"));
    revalidatePath("/app");
    revalidatePath("/app/albums");
    redirect(`/app/albums/${collection.id}`);
  } catch (error) {
    return { error: message(error) };
  }
}

export async function adjustQuantityAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const userAlbumId = formData.get("userAlbumId");
  try {
    await service().adjustQuantity(user.id, userAlbumId, formData.get("stickerId"), {
      change: formData.get("change"),
    });
    if (typeof userAlbumId === "string") {
      revalidatePath(`/app/albums/${userAlbumId}`);
      revalidatePath("/app");
    }
  } catch (error) {
    const text = message(error);
    if (error instanceof CollectionError && ["forbidden", "not_found"].includes(error.code)) {
      redirect("/app");
    }
    throw new Error(text);
  }
}

export async function removeAlbumAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  try {
    await service().removeAlbum(user.id, formData.get("userAlbumId"));
  } catch (error) {
    if (error instanceof CollectionError && ["forbidden", "not_found"].includes(error.code)) redirect("/app");
    throw error;
  }
  revalidatePath("/app");
  revalidatePath("/app/albums");
  redirect("/app");
}

export async function enableSharingAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const userAlbumId = formData.get("userAlbumId");
  try {
    await service().enableSharing(user.id, userAlbumId);
  } catch (error) {
    if (error instanceof CollectionError && ["forbidden", "not_found"].includes(error.code)) redirect("/app");
    throw new Error(message(error));
  }
  if (typeof userAlbumId === "string") revalidatePath(`/app/albums/${userAlbumId}`);
}

export async function disableSharingAction(formData: FormData): Promise<void> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const userAlbumId = formData.get("userAlbumId");
  try {
    await service().disableSharing(user.id, userAlbumId);
  } catch (error) {
    if (error instanceof CollectionError && ["forbidden", "not_found"].includes(error.code)) redirect("/app");
    throw new Error(message(error));
  }
  if (typeof userAlbumId === "string") revalidatePath(`/app/albums/${userAlbumId}`);
}
