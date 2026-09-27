"use client";

import { useActionState } from "react";
import type { UserRole, UserStatus } from "@/lib/db/schema";
import {
  changeRoleAction,
  changeStatusAction,
  type AdminActionState,
} from "./actions";

const initialState: AdminActionState = {};

export function UserActions({
  userId,
  role,
  status,
}: {
  userId: string;
  role: UserRole;
  status: UserStatus;
}) {
  const [roleState, roleAction, rolePending] = useActionState(changeRoleAction, initialState);
  const [statusState, statusAction, statusPending] = useActionState(
    changeStatusAction,
    initialState,
  );
  const state = roleState.error || roleState.success ? roleState : statusState;

  return (
    <div className="flex min-w-44 flex-col gap-2">
      <form action={roleAction}>
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="role" value={role === "admin" ? "user" : "admin"} />
        <button
          className="w-full rounded border border-border bg-surface px-2 py-1 text-sm text-content hover:bg-surface-muted"
          disabled={rolePending}
        >
          {role === "admin" ? "Degradar a user" : "Promover a admin"}
        </button>
      </form>
      <form action={statusAction}>
        <input type="hidden" name="userId" value={userId} />
        <input type="hidden" name="status" value={status === "active" ? "banned" : "active"} />
        <button
          className="w-full rounded border border-border bg-surface px-2 py-1 text-sm text-content hover:bg-surface-muted"
          disabled={statusPending}
        >
          {status === "active" ? "Bloquear" : "Desbloquear"}
        </button>
      </form>
      {state.error ? <p className="text-xs text-danger">{state.error}</p> : null}
      {state.success ? <p className="text-xs text-success">{state.success}</p> : null}
    </div>
  );
}
