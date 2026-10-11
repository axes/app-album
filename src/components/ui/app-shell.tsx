import Link from "next/link";
import type { ReactNode } from "react";
import { logoutAction } from "@/app/logout/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "./button";

/**
 * Presentational application shell (UI-03B).
 *
 * It is deliberately auth-agnostic: it never reads the session or the current
 * user. The caller (the public root layout or an authenticated layout) resolves
 * the user and passes it in, so the same shell can wrap public and private
 * routes. When `user` is absent the shell renders the public navigation; when
 * it is present it renders the authenticated navigation, the admin entries only
 * for `role === "admin"`, the username and the logout form.
 *
 * The logout control is exactly a `<form action={logoutAction}>`, so it keeps
 * working without JavaScript and reuses the existing Server Action.
 */
export type AppShellUser = {
  username: string;
  role: "user" | "admin";
};

export type AppShellProps = {
  user?: AppShellUser | null;
  children: ReactNode;
  className?: string;
};

const navLinkClass =
  "text-primary underline underline-offset-2 hover:text-accent";

export function AppShell({ user = null, children, className }: AppShellProps) {
  return (
    <div
      className={[
        "flex min-h-screen flex-col bg-background text-content",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
          <Link
            href={user ? "/app" : "/"}
            className="text-base font-semibold text-content"
          >
            App Álbum
          </Link>

          <nav
            aria-label={user ? "Navegación principal" : "Navegación pública"}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm"
          >
            {user ? (
              <>
                <Link className={navLinkClass} href="/app">
                  Mis álbumes
                </Link>
                <Link className={navLinkClass} href="/app/albums">
                  Explorar álbumes
                </Link>
                {user.role === "admin" ? (
                  <>
                    <Link className={navLinkClass} href="/admin/albums">
                      Administrar álbumes
                    </Link>
                    <Link className={navLinkClass} href="/admin/users">
                      Administrar usuarios
                    </Link>
                  </>
                ) : null}
              </>
            ) : (
              <>
                <Link className={navLinkClass} href="/login">
                  Iniciar sesión
                </Link>
                <Link className={navLinkClass} href="/register">
                  Crear cuenta
                </Link>
              </>
            )}
          </nav>

          <div className="ml-auto flex flex-wrap items-center gap-3">
            <ThemeToggle />
            {user ? (
              <>
                <span className="text-sm text-muted">{user.username}</span>
                <form action={logoutAction}>
                  <Button type="submit" variant="secondary" size="sm">
                    Cerrar sesión
                  </Button>
                </form>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6">
        {children}
      </main>
    </div>
  );
}
