"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isActiveAdmin } from "@/lib/admin/authorization";
import { DrizzleAdminUserRepository } from "@/lib/admin/drizzle-repository";
import { AdminOperationError, AdminUserService } from "@/lib/admin/service";

export type AdminActionState = { error?: string; success?: string };

function messageFor(error: unknown): string {
  if (error instanceof AdminOperationError) {
    if (error.code === "last_active_admin") {
      return "Debe permanecer al menos un administrador activo.";
    }
    if (error.code === "forbidden") {
      return "No tienes autorización para realizar esta operación.";
    }
    if (error.code === "not_found") {
      return "El usuario ya no existe.";
    }
  }
  return "No se pudo actualizar el usuario.";
}

async function actorId(): Promise<string | null> {
  const user = await getCurrentUser();
  return isActiveAdmin(user) ? user.id : null;
}

export async function changeRoleAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await actorId();
  if (!actor) return { error: "No tienes autorización para realizar esta operación." };
  try {
    await new AdminUserService(new DrizzleAdminUserRepository()).changeRole(
      actor,
      formData.get("userId"),
      formData.get("role"),
    );
    revalidatePath("/admin/users");
    return { success: "Rol actualizado." };
  } catch (error) {
    return { error: messageFor(error) };
  }
}

export async function changeStatusAction(
  _state: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  const actor = await actorId();
  if (!actor) return { error: "No tienes autorización para realizar esta operación." };
  try {
    await new AdminUserService(new DrizzleAdminUserRepository()).changeStatus(
      actor,
      formData.get("userId"),
      formData.get("status"),
    );
    revalidatePath("/admin/users");
    return { success: "Estado actualizado." };
  } catch (error) {
    return { error: messageFor(error) };
  }
}
