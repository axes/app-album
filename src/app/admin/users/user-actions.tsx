"use client";

import { useActionState } from "react";
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
 * `FormData` payloads are unchanged: each button still submits a hidden
 * `userId` plus the target `role` / `status`. Only the presentation changed —
 * the actions used to be two full-width stacked buttons and are now a single
 * wrapping row of compact controls.
 *
 * Blocking is destructive, so it goes through `ConfirmAction` (native
 * `<dialog>`, no `window.confirm`) and explains the consequence before the
 * action runs. Unblocking is not destructive and stays a plain button.
 *
 * Every control carries an `aria-label` that includes the user name, because
 * the visible labels ("Bloquear", "Degradar a usuario") are identical on every
 * row and would otherwise be indistinguishable in a screen reader's control
 * list.
 */
export function UserActions({
  userId,
  username,
  role,
  status,
}: {
  userId: string;
  username: string;
  role: UserRole;
  status: UserStatus;
}) {
  const [roleState, roleAction, rolePending] = useActionState(changeRoleAction, initialState);
  const [statusState, statusAction, statusPending] = useActionState(
    changeStatusAction,
    initialState,
  );
  const state = roleState.error || roleState.success ? roleState : statusState;

  const demoting = role === "admin";
  const blocking = status === "active";

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <form action={roleAction}>
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="role" value={demoting ? "user" : "admin"} />
          <Button
            type="submit"
            size="sm"
            variant="secondary"
            disabled={rolePending}
            aria-label={
              demoting
                ? `Degradar a usuario a ${username}`
                : `Promover a administrador a ${username}`
            }
            icon={<Icon name={demoting ? "chevronDown" : "chevronUp"} size="sm" />}
          >
            {demoting ? "Degradar a usuario" : "Promover a administrador"}
          </Button>
        </form>

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
      </div>
      {state.error ? <p className="text-xs text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-xs text-success" role="status">{state.success}</p> : null}
    </div>
  );
}
