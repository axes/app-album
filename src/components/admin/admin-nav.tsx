import { Icon, type IconName } from "@/components/ui/icons";
import { NavLink } from "@/components/ui/nav-link";

/**
 * Administrative navigation (Commit 1 — administrative navigation separation).
 *
 * The admin destinations are no longer mixed with the user destinations in the
 * desktop header row or in the mobile dock. They live in their own region so
 * the two contexts stay conceptually separate:
 *
 *  - Desktop: rendered as a second header row, below the user row
 *    (`Mis álbumes` / `Explorar álbumes` + theme + username + logout).
 *  - Mobile: the same row stays reachable as a compact, horizontally
 *    scrollable strip, so both destinations remain available without turning
 *    them into extra dock slots.
 *
 * Every item is a `NavLink`, so the active state keeps flowing through the
 * single `aria-current="page"` source. Icons come from the DESIGN v2 §6 map
 * (`albums`, `users`). Labels never wrap (`whitespace-nowrap`) so the row can
 * scroll horizontally instead of breaking the layout.
 *
 * `/admin/albums` also flags its detail route (`/admin/albums/[id]`) through
 * `prematch`. The match is scoped to that single parent so the region never
 * emits two `aria-current="page"` at once: `/admin/users` keeps an exact match
 * and is never active on an album detail page.
 *
 * This component is presentational: it never reads the session or the role.
 * The caller (the authenticated shell) decides whether to render it, so the
 * authorization rules stay exactly where they were.
 */
export type AdminNavItem = {
  href: string;
  label: string;
  icon: IconName;
  /**
   * Optional parent prefix that also marks the item as current. Used by
   * `/admin/albums` so its detail route stays highlighted without a second
   * item becoming current.
   */
  prematch?: string;
};

export const ADMIN_NAV_ITEMS: readonly AdminNavItem[] = [
  {
    href: "/admin/albums",
    label: "Administrar álbumes",
    icon: "albums",
    prematch: "/admin/albums",
  },
  { href: "/admin/users", label: "Administrar usuarios", icon: "users" },
] as const;

const linkBase =
  "admin-nav-link inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-control px-3 text-sm font-medium text-content transition-colors duration-[var(--transition-fast)] ease-[var(--motion-ease)] hover:bg-surface-muted hover:text-primary";

export function AdminNav() {
  return (
    <nav
      aria-label="Navegación de administración"
      data-component="admin-nav"
      className="admin-nav w-full"
    >
      <ul className="admin-nav-list flex w-full items-center gap-1 overflow-x-auto whitespace-nowrap">
        {ADMIN_NAV_ITEMS.map((item) => (
          <li key={item.href} className="admin-nav-slot flex-none">
            <NavLink
              href={item.href}
              prematch={item.prematch}
              className={linkBase}
            >
              <Icon name={item.icon} size="sm" />
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
