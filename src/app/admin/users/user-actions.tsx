"use client";

import { useActionState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmAction } from "@/components/ui/confirm-action";
import { Icon } from "@/components/ui/icons";
import type { UserRole, UserStatus } from "@/lib/db/schema";
import {
  changeRoleAction,
  changeStatusAction,
  type AdminActionState,
} from "./actions";

const initialState: AdminActionState = {};

/**
 * Row actions for `/admin/users`.
 *
 * The two Server Actions (`changeRoleAction`, `changeStatusAction`) and their
 * `FormData` payloads are unchanged: each control still submits a hidden
 * `userId` plus the target `role` / `status`. Only the presentation changed.
 *
 * Every mutation that changes what a user can do — promoting, demoting and
 * blocking — goes through `ConfirmAction` (native `<dialog>`, never
 * `window.confirm`) and states the consequence before the action runs.
 * Unblocking is not destructive and stays a plain button.
 *
 * The visible labels are short ("Promover", "Degradar", "Bloquear",
 * "Desbloquear") so the actions column stays narrow and wraps instead of
 * widening the table; the full sentence lives in `aria-label`, which also
 * carries the user name so the controls are distinguishable in a screen
 * reader's control list.
 *
 * The current user's own row never offers the destructive controls: an
 * administrator cannot demote or block themselves from the UI. The server-side
 * rule is enforced separately in `assertAdminMutationAllowed`.
 */
export function UserActions({
  userId,
  username,
  role,
  status,
  isSelf,
}: {
  userId: string;
  username: string;
  role: UserRole;
  status: UserStatus;
  isSelf: boolean;
}) {
  const [roleState, roleAction, rolePending] = useActionState(changeRoleAction, initialState);
  const [statusState, statusAction, statusPending] = useActionState(
    changeStatusAction,
    initialState,
  );
  const state = roleState.error || roleState.success ? roleState : statusState;

  const demoting = role === "admin";
  const blocking = status === "active";

  // Self-protection: the destructive affordances are hidden on your own row.
  const showRoleAction = !(isSelf && demoting);
  const showStatusAction = !(isSelf && blocking);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {isSelf ? <Badge variant="neutral">Tú</Badge> : null}

        {showRoleAction ? (
          <form action={roleAction}>
            <input type="hidden" name="userId" value={userId} />
            <input type="hidden" name="role" value={demoting ? "user" : "admin"} />
            <ConfirmAction
              title={demoting ? `Degradar a ${username}` : `Promover a ${username}`}
              description={
                demoting
                  ? `${username} perderá el acceso de administración.`
                  : `${username} podrá ver y administrar álbumes y usuarios.`
              }
              confirmLabel={demoting ? "Degradar" : "Promover"}
              pendingLabel={demoting ? "Degradando…" : "Promoviendo…"}
              triggerLabel={demoting ? "Degradar" : "Promover"}
              triggerVariant="secondary"
              triggerSize="sm"
              triggerIcon={<Icon name={demoting ? "chevronDown" : "chevronUp"} size="sm" />}
              triggerAriaLabel={
                demoting
                  ? `Degradar a ${username} a usuario`
                  : `Promover a ${username} a administrador`
              }
              pending={rolePending}
            />
          </form>
        ) : null}

        {showStatusAction ? (
          <form action={statusAction}>
            <input type="hidden" name="userId" value={userId} />
            <input type="hidden" name="status" value={blocking ? "banned" : "active"} />
            {blocking ? (
              <ConfirmAction
                title={`Bloquear a ${username}`}
                description="El usuario perderá el acceso de inmediato y no podrá volver a iniciar sesión hasta que lo desbloquees."
                confirmLabel="Bloquear"
                pendingLabel="Bloqueando…"
                triggerLabel="Bloquear"
                triggerVariant="dangerGhost"
                triggerSize="sm"
                triggerIcon={<Icon name="lock" size="sm" />}
                triggerAriaLabel={`Bloquear a ${username}`}
                pending={statusPending}
              />
            ) : (
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                disabled={statusPending}
                aria-label={`Desbloquear a ${username}`}
                icon={<Icon name="unlock" size="sm" />}
              >
                Desbloquear
              </Button>
            )}
          </form>
        ) : null}
      </div>
      {state.error ? <p className="text-xs text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-xs text-success" role="status">{state.success}</p> : null}
    </div>
  );
}
