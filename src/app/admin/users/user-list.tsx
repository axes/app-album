"use client";

import { useMemo, useState } from "react";
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
import type { AdminUser } from "@/lib/admin/service";
import type { EmailOwnerType, UserRole, UserStatus } from "@/lib/db/schema";
import { UserActions } from "./user-actions";

/**
 * Admin user list (Commit 4 — `/admin/users`).
 *
 * Client Component that owns only the local search state. The data still comes
 * from the Server Component (`page.tsx` → `AdminUserService.listUsers()`), and
 * every mutation still goes through the untouched Server Actions in
 * `./actions.ts`; this file never talks to a repository or a service.
 *
 * The visible vocabulary is Spanish and never leaks the internal enum values
 * (`admin` / `user`, `active` / `banned`): role and status render as `Badge`
 * pills with the approved labels.
 */

const ownerLabels: Record<EmailOwnerType, string> = {
  self: "Propio",
  parent: "Padre/madre",
  guardian: "Tutor/a",
  other: "Otro contacto",
};

const roleLabels: Record<UserRole, string> = {
  admin: "Administrador",
  user: "Usuario",
};

const statusLabels: Record<UserStatus, string> = {
  active: "Activo",
  banned: "Bloqueado",
};

export type AdminUserListProps = {
  users: AdminUser[];
  /** Id of the signed-in administrator, used to protect their own row. */
  currentUserId: string;
};

function searchableText(user: AdminUser) {
  return [user.username, user.email].join(" ").toLocaleLowerCase("es-CL");
}

export function AdminUserList({ users, currentUserId }: AdminUserListProps) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLocaleLowerCase("es-CL");
  const filteredUsers = useMemo(
    () =>
      normalizedQuery
        ? users.filter((user) => searchableText(user).includes(normalizedQuery))
        : users,
    [users, normalizedQuery],
  );

  if (users.length === 0) {
    return <EmptyState title="Todavía no hay usuarios" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="max-w-md">
        <Field
          label="Buscar usuario"
          name="user-search"
          icon="explore"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      <p role="status" aria-live="polite" className="text-sm tabular-nums text-muted">
        {filteredUsers.length} {filteredUsers.length === 1 ? "resultado" : "resultados"}
      </p>

      {filteredUsers.length === 0 ? (
        <EmptyState
          title="No encontramos usuarios"
          description="Prueba con otro nombre de usuario o email."
          icon={<Icon name="explore" size="lg" />}
          action={(
            <Button variant="secondary" onClick={() => setQuery("")}>
              Limpiar búsqueda
            </Button>
          )}
        />
      ) : (
        <DataTable ariaLabel="Usuarios" minWidth="48rem" className="bg-surface">
          <DataTableHead>
            <DataTableRow>
              <DataTableHeaderCell>Usuario</DataTableHeaderCell>
              <DataTableHeaderCell>Email</DataTableHeaderCell>
              <DataTableHeaderCell>Contacto</DataTableHeaderCell>
              <DataTableHeaderCell>Rol</DataTableHeaderCell>
              <DataTableHeaderCell>Estado</DataTableHeaderCell>
              <DataTableHeaderCell>Acciones</DataTableHeaderCell>
            </DataTableRow>
          </DataTableHead>
          <DataTableBody>
            {filteredUsers.map((user) => (
              <DataTableRow className="last:border-b-0" key={user.id}>
                <DataTableCell>
                  <div className="font-semibold text-content">{user.username}</div>
                </DataTableCell>
                <DataTableCell className="break-words">{user.email}</DataTableCell>
                <DataTableCell>{ownerLabels[user.emailOwnerType]}</DataTableCell>
                <DataTableCell>
                  <Badge variant={user.role === "admin" ? "primary" : "neutral"}>
                    {roleLabels[user.role]}
                  </Badge>
                </DataTableCell>
                <DataTableCell>
                  <Badge variant={user.status === "active" ? "success" : "danger"}>
                    {statusLabels[user.status]}
                  </Badge>
                </DataTableCell>
                <DataTableCell>
                  <UserActions
                    userId={user.id}
                    username={user.username}
                    role={user.role}
                    status={user.status}
                    isSelf={user.id === currentUserId}
                  />
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      )}
    </div>
  );
}
