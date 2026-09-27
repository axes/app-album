import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import Link from "next/link";
import { logoutAction } from "@/app/logout/actions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AppPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Área protegida</h1>
      <p className="text-neutral-600">
        Sesión activa para <strong>{user.username}</strong>.
      </p>
      {user.role === "admin" ? (
        <Link className="underline" href="/admin/users">
          Administrar usuarios
        </Link>
      ) : null}
      <form action={logoutAction}>
        <button
          className="rounded border border-neutral-300 px-4 py-2"
          type="submit"
        >
          Cerrar sesión
        </button>
      </form>
    </section>
  );
}
