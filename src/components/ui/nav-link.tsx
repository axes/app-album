"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";

/**
 * UI-05A: client-side navigation link.
 *
 * This is the only place in the productive app that emits `aria-current="page"`,
 * so every consumer that needs an active link (desktop nav, public nav,
 * admin nav and the mobile dock) stays mutually exclusive by construction.
 *
 * The contract is intentionally narrow:
 *  - `href` is the exact match used for the active state.
 *  - `prematch`, when provided, is also treated as active when `pathname`
 *    starts with it. Use it for parent routes that should also flag their
 *    children (e.g. `/admin` flagging `/admin/albums`).
 *  - The component never falls back to "startsWith(href)" by default, because
 *    the only product routes today are flat: `/app`, `/app/albums`,
 *    `/admin/albums`, `/admin/users`, `/login`, `/register`. A wrong default
 *    here would create two active items simultaneously.
 *  - `children` and any extra `Link` props are forwarded unchanged, so the
 *    visual contract of the consumer stays intact.
 */
export type NavLinkProps = Omit<ComponentProps<typeof Link>, "href" | "children"> & {
  href: string;
  children: ReactNode;
  prematch?: string;
};

export function NavLink({ href, prematch, children, className, ...rest }: NavLinkProps) {
  const pathname = usePathname();
  const isActive =
    pathname === href || (prematch ? pathname?.startsWith(prematch) : false);

  const classes = [className, isActive ? "is-current" : ""]
    .filter(Boolean)
    .join(" ");

  const ariaCurrent = isActive ? "page" : undefined;

  return (
    <Link
      href={href}
      aria-current={ariaCurrent}
      data-current={isActive ? "true" : undefined}
      className={classes}
      {...rest}
    >
      {children}
    </Link>
  );
}
