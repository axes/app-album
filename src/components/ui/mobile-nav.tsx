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
 * The dock publishes **only user destinations**, for every role. Admin
 * destinations are not mixed in here: they live in their own region
 * (`AdminNav`, rendered as a second header row by the authenticated shell) so
 * the two contexts stay conceptually separate. This keeps the dock geometry
 * stable at two slots regardless of the session role.
 *
 * Only destinations backed by a real route are published. The grid is sized
 * dynamically from `MOBILE_NAV_ITEMS.length` so the geometry stays stable when
 * future phases add `Me faltan`, `Cambios` and `Perfil` against real routes.
 * No `disabled`, no `data-provisional` and no placeholder labels: the rule is
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

export function MobileNav() {
  const items = MOBILE_NAV_ITEMS;
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
