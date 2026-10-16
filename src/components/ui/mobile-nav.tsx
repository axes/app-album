import { NavLink } from "./nav-link";
import { Icon } from "./icons";
import type { ReactNode } from "react";

/**
 * UI-05A: productive mobile dock.
 *
 * The dock is a Server Component that renders the bottom navigation visible
 * below the `md` breakpoint. Every item is an `<a>` via `NavLink`, so the
 * active state flows through the single `aria-current` source.
 *
 * Only destinations backed by a real route are published. UI-05A ships with
 * two slots (`Mis álbumes`, `Explorar`) and the grid is sized dynamically
 * from `MOBILE_NAV_ITEMS.length` so the geometry stays stable when future
 * phases add `Me faltan`, `Cambios` and `Perfil` against real routes. No
 * `disabled`, no `data-provisional` and no placeholder labels: the rule is
 * that the dock only mirrors real destinations.
 *
 * Icons come from the single DESIGN v2 §6 module (`./icons`). The dock uses
 * the 24 px size mandated for mobile navigation; the glyphs are decorative
 * because the label is always rendered next to them.
 */
export type MobileNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

export const MOBILE_NAV_ITEMS: readonly MobileNavItem[] = [
  { href: "/app", label: "Mis álbumes", icon: <Icon name="albums" size="lg" /> },
  { href: "/app/albums", label: "Explorar", icon: <Icon name="explore" size="lg" /> },
] as const;

export const ADMIN_MOBILE_NAV_ITEMS: readonly MobileNavItem[] = [
  ...MOBILE_NAV_ITEMS,
  { href: "/admin/albums", label: "Álbumes", icon: <Icon name="albums" size="lg" /> },
  { href: "/admin/users", label: "Usuarios", icon: <Icon name="profile" size="lg" /> },
] as const;

export function MobileNav({ role = "user" }: { role?: "user" | "admin" }) {
  const items = role === "admin" ? ADMIN_MOBILE_NAV_ITEMS : MOBILE_NAV_ITEMS;
  return (
    <nav
      aria-label="Navegación inferior"
      data-component="mobile-nav"
      className="mobile-nav bg-surface border-t border-border"
    >
      <ul
        className="mobile-nav-grid"
        style={{
          gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        }}
      >
        {items.map((item) => (
          <li key={item.href} className="mobile-nav-slot">
            <NavLink
              href={item.href}
              className="mobile-nav-link"
              aria-label={item.label}
            >
              <span className="mobile-nav-icon" aria-hidden="true">
                {item.icon}
              </span>
              <span className="mobile-nav-label">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
