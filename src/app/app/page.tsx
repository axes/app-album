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
      <p className="text-muted">
        Sesión activa para <strong className="text-content">{user.username}</strong>.
      </p>
      {user.role === "admin" ? (
        <nav className="flex flex-col gap-2">
          <Link className="text-primary underline" href="/admin/users">
            Administrar usuarios
          </Link>
          <Link className="text-primary underline" href="/admin/albums">
            Administrar álbumes
          </Link>
        </nav>
      ) : null}
      <form action={logoutAction}>
        <button
          className="rounded border border-border bg-surface px-4 py-2 text-content hover:bg-surface-muted"
          type="submit"
        >
          Cerrar sesión
        </button>
      </form>
    </section>
  );
}
