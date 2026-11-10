import { AdminOperationError, type AdminMutation, type AdminUser } from "./service";

/**
 * Server-side policy for administrative user mutations.
 *
 * Two invariants, in this order:
 *
 *   1. **The system always keeps at least one active administrator.** Removing
 *      the last one would lock everybody out of `/admin`.
 *   2. **An administrator cannot change their own role or block their own
 *      account.** Without this, an administrator could demote themselves and
 *      lose access to the very screen they are standing on.
 *
 * The order matters: when only one active administrator exists, the actor *is*
 * the target, so both rules apply. The global invariant is reported first
 * because "Debe permanecer al menos un administrador activo." explains the
 * situation better than the self-protection message.
 *
 * The rule is enforced here, in the server layer, and not only in the UI: the
 * `/admin/users` list hides the destructive controls on your own row, but the
 * repository calls this function inside the transaction regardless of what the
 * client sent.
 */
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

  // Self-protection. Only the two destructive transitions are rejected:
  // promoting yourself or unblocking yourself is a no-op for an active
  // administrator and stays allowed.
  const mutatesSelf = actor.id === target.id;
  const isSelfDemotion = mutation.type === "role" && mutation.value === "user";
  const isSelfBlock = mutation.type === "status" && mutation.value === "banned";

  if (mutatesSelf && (isSelfDemotion || isSelfBlock)) {
    throw new AdminOperationError("self_mutation");
  }
}
