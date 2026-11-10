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
 *  - Mobile: the same row stays reachable as a compact strip. Below `sm` each
 *    item shows its `shortLabel` behind an "Admin" context tag, so both
 *    destinations fit at 375 px without horizontal scrolling. The full label
 *    remains the accessible name of the link.
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
  /**
   * Compact label shown below `sm`, where the full labels do not fit side by
   * side. The link keeps the full `label` as its accessible name.
   */
  shortLabel: string;
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
    shortLabel: "Álbumes",
    icon: "albums",
    prematch: "/admin/albums",
  },
  {
    href: "/admin/users",
    label: "Administrar usuarios",
    shortLabel: "Usuarios",
    icon: "users",
  },
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
        <li
          className="admin-nav-context flex-none pr-1 text-xs font-semibold uppercase tracking-wide text-muted sm:hidden"
          aria-hidden="true"
        >
          Admin
        </li>
        {ADMIN_NAV_ITEMS.map((item) => (
          <li key={item.href} className="admin-nav-slot flex-none">
            <NavLink
              href={item.href}
              prematch={item.prematch}
              className={linkBase}
              aria-label={item.label}
            >
              <Icon name={item.icon} size="sm" />
              <span className="hidden sm:inline">{item.label}</span>
              <span className="sm:hidden" aria-hidden="true">
                {item.shortLabel}
              </span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
