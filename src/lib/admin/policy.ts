import { AdminOperationError, type AdminMutation, type AdminUser } from "./service";

export function assertAdminMutationAllowed(
  actor: AdminUser | null,
  target: AdminUser | null,
  mutation: AdminMutation,
  activeAdminCount: number,
): asserts actor is AdminUser {
  if (!actor || actor.role !== "admin" || actor.status !== "active") {
    throw new AdminOperationError("forbidden");
  }
  if (!target) {
    throw new AdminOperationError("not_found");
  }

  const removesActiveAdmin =
    target.role === "admin" &&
    target.status === "active" &&
    ((mutation.type === "role" && mutation.value === "user") ||
      (mutation.type === "status" && mutation.value === "banned"));

  if (removesActiveAdmin && activeAdminCount <= 1) {
    throw new AdminOperationError("last_active_admin");
  }
}
