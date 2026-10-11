import { PageHeader } from "@/components/ui/page-header";
import { DrizzleAdminUserRepository } from "@/lib/admin/drizzle-repository";
import { AdminUserService } from "@/lib/admin/service";
import { UserActions } from "./user-actions";

const ownerLabels = {
  self: "Propio",
  parent: "Padre/madre",
  guardian: "Tutor/a",
  other: "Otro contacto",
};

export default async function AdminUsersPage() {
  const users = await new AdminUserService(new DrizzleAdminUserRepository()).listUsers();

  return (
    <section className="flex flex-col gap-5">
      <PageHeader title="Administración de usuarios" />
      <div className="overflow-x-auto rounded border border-border bg-surface">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="p-2">Usuario</th>
              <th className="p-2">Email</th>
              <th className="p-2">Contacto</th>
              <th className="p-2">Rol</th>
              <th className="p-2">Estado</th>
              <th className="p-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr className="border-b border-border align-top last:border-b-0" key={user.id}>
                <td className="p-2 font-medium">{user.username}</td>
                <td className="p-2">{user.email}</td>
                <td className="p-2">{ownerLabels[user.emailOwnerType]}</td>
                <td className="p-2">{user.role}</td>
                <td className="p-2">{user.status}</td>
                <td className="p-2">
                  <UserActions userId={user.id} role={user.role} status={user.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
