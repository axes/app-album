import { NavLink } from "./nav-link";
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
 */
export type MobileNavItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

function homeIcon(): ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <path d="M13 4h4a3 3 0 0 1 3 3v4" />
    </svg>
  );
}

function exploreIcon(): ReactNode {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-6 w-6"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="6" />
      <path d="m20 20-4-4" />
    </svg>
  );
}

export const MOBILE_NAV_ITEMS: readonly MobileNavItem[] = [
  { href: "/app", label: "Mis álbumes", icon: homeIcon() },
  { href: "/app/albums", label: "Explorar", icon: exploreIcon() },
] as const;

export function MobileNav() {
  return (
    <nav
      aria-label="Navegación inferior"
      data-component="mobile-nav"
      className="mobile-nav bg-surface border-t border-border"
    >
      <ul
        className="mobile-nav-grid"
        style={{
          gridTemplateColumns: `repeat(${MOBILE_NAV_ITEMS.length}, minmax(0, 1fr))`,
        }}
      >
        {MOBILE_NAV_ITEMS.map((item) => (
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
