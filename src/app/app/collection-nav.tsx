import Link from "next/link";
import { logoutAction } from "@/app/logout/actions";
import type { AuthenticatedUser } from "@/lib/auth/service";

export function CollectionNav({ user }: { user: AuthenticatedUser }) {
  return (
    <nav aria-label="Colección" className="flex flex-wrap items-center gap-3 text-sm">
      <Link className="text-primary underline" href="/app">Mis álbumes</Link>
      <Link className="text-primary underline" href="/app/albums">Explorar álbumes</Link>
      {user.role === "admin" ? (
        <>
          <Link className="text-primary underline" href="/admin/albums">Administrar álbumes</Link>
          <Link className="text-primary underline" href="/admin/users">Administrar usuarios</Link>
        </>
      ) : null}
      <form action={logoutAction} className="ml-auto">
        <button className="rounded border border-border bg-surface px-3 py-2 text-content hover:bg-surface-muted" type="submit">
          Cerrar sesión
        </button>
      </form>
    </nav>
  );
}
