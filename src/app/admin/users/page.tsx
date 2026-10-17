import { PageHeader } from "@/components/ui/page-header";
import { DrizzleAdminUserRepository } from "@/lib/admin/drizzle-repository";
import { AdminUserService } from "@/lib/admin/service";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AdminUserList } from "./user-list";

export default async function AdminUsersPage() {
  const [users, currentUser] = await Promise.all([
    new AdminUserService(new DrizzleAdminUserRepository()).listUsers(),
    getCurrentUser(),
  ]);

  return (
    <section className="flex flex-col gap-5">
      <PageHeader
        title="Administración de usuarios"
        metadata={`${users.length} ${users.length === 1 ? "usuario" : "usuarios"}`}
      />
      <AdminUserList users={users} currentUserId={currentUser?.id ?? ""} />
    </section>
  );
}
