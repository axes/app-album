import type { ReactNode } from "react";
import { logoutAction } from "@/app/logout/actions";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "./button";
import { LogoPlaceholder } from "./logo-placeholder";
import { MobileNav, MOBILE_NAV_ITEMS } from "./mobile-nav";
import { NavLink } from "./nav-link";

/**
 * Presentational application shell (UI-03B, redesigned in UI-05A).
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
 *
 * UI-05A visual updates are token-driven: every colour, radius, shadow and
 * motion variable comes from the same `productive*` exports that feed
 * `/dev/ui`, the portable CSS and the JSON handoff. The header reuses
 * `LogoPlaceholder` (a token-driven square) and `NavLink` (the single source
 * of `aria-current="page"`). The mobile dock publishes only real destinations
 * sourced from `MOBILE_NAV_ITEMS`.
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

const linkBase =
  "rounded-control px-3 py-2 text-sm font-medium text-content transition-colors duration-[var(--transition-fast)] ease-[var(--motion-ease)] hover:bg-surface-muted hover:text-primary";

export function AppShell({ user = null, children, className }: AppShellProps) {
  return (
    <div
      data-component="app-shell"
      className={[
        "app-shell flex min-h-screen flex-col bg-background text-content",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header className="app-shell-header border-b border-border bg-surface">
        <div className="app-shell-header-inner mx-auto flex w-full max-w-5xl items-center gap-3 px-4 py-3">
          <NavLink
            href={user ? "/app" : "/"}
            className="app-shell-brand flex items-center gap-2 text-base font-semibold text-content"
            aria-label="App Álbum — ir al inicio"
          >
            <LogoPlaceholder className="h-9 w-9" label="Logo de App Álbum" />
            <span>App Álbum</span>
          </NavLink>

          <nav
            aria-label={user ? "Navegación principal" : "Navegación pública"}
            className="app-shell-nav hidden flex-1 items-center gap-1 md:flex"
          >
            {user ? (
              <>
                <NavLink href="/app" className={linkBase}>
                  Mis álbumes
                </NavLink>
                <NavLink href="/app/albums" className={linkBase}>
                  Explorar álbumes
                </NavLink>
                {user.role === "admin" ? (
                  <>
                    <NavLink href="/admin/albums" className={linkBase}>
                      Administrar álbumes
                    </NavLink>
                    <NavLink href="/admin/users" className={linkBase}>
                      Administrar usuarios
                    </NavLink>
                  </>
                ) : null}
              </>
            ) : (
              <>
                <NavLink href="/login" className={linkBase}>
                  Iniciar sesión
                </NavLink>
                <NavLink href="/register" className={linkBase}>
                  Crear cuenta
                </NavLink>
              </>
            )}
          </nav>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <ThemeToggle />
            {user ? (
              <>
                <span
                  className="app-shell-username hidden text-sm text-muted sm:inline"
                  data-component="app-shell-username"
                >
                  {user.username}
                </span>
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

      <main className="app-shell-main mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>

      <div
        className="app-shell-dock md:hidden"
        data-component="app-shell-dock"
        data-item-count={MOBILE_NAV_ITEMS.length}
      >
        <MobileNav />
      </div>
    </div>
  );
}
