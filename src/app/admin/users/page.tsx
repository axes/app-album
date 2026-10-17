import { PageHeader } from "@/components/ui/page-header";
import { DrizzleAdminUserRepository } from "@/lib/admin/drizzle-repository";
import { AdminUserService } from "@/lib/admin/service";
import { AdminUserList } from "./user-list";

export default async function AdminUsersPage() {
  const users = await new AdminUserService(new DrizzleAdminUserRepository()).listUsers();

  return (
    <section className="flex flex-col gap-5">
      <PageHeader
        title="Administración de usuarios"
        metadata={`${users.length} ${users.length === 1 ? "usuario" : "usuarios"}`}
      />
      <AdminUserList users={users} />
    </section>
  );
}
