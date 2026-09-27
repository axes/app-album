import Link from "next/link";
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
      <div>
        <Link className="text-sm underline" href="/app">← Volver</Link>
        <h1 className="mt-2 text-2xl font-semibold">Administración de usuarios</h1>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left text-sm">
          <thead><tr className="border-b"><th className="p-2">Usuario</th><th className="p-2">Email</th><th className="p-2">Contacto</th><th className="p-2">Rol</th><th className="p-2">Estado</th><th className="p-2">Acciones</th></tr></thead>
          <tbody>
            {users.map((user) => (
              <tr className="border-b align-top" key={user.id}>
                <td className="p-2 font-medium">{user.username}</td>
                <td className="p-2">{user.email}</td>
                <td className="p-2">{ownerLabels[user.emailOwnerType]}</td>
                <td className="p-2">{user.role}</td>
                <td className="p-2">{user.status}</td>
                <td className="p-2"><UserActions userId={user.id} role={user.role} status={user.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
