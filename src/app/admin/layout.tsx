import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { isActiveAdmin } from "@/lib/admin/authorization";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!isActiveAdmin(user)) {
    redirect("/app");
  }
  return children;
}
