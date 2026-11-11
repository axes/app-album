import Link from "next/link";
import { SITE } from "@/lib/site/info";
import { Wordmark } from "./wordmark";

/**
 * Minimal public footer: what the site is, where the help and legal pages
 * live, and how to get in touch. Rendered by the public pages through the
 * `footer` slot of `AppShell`.
 */
const FOOTER_LINKS = [
  { href: "/faq", label: "Preguntas frecuentes" },
  { href: "/terminos", label: "Términos y condiciones" },
] as const;

const linkClass =
  "inline-flex min-h-11 items-center rounded-control text-sm text-primary underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2";

export function SiteFooter({ year = new Date().getFullYear() }: { year?: number }) {
  return (
    <footer data-component="site-footer" className="site-footer border-t border-border bg-surface">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex max-w-sm flex-col gap-1">
          <Wordmark size="sm" />
          <p className="type-small text-muted">
            Lleva el control de tus álbumes de láminas: cuáles tienes, cuáles te faltan y cuáles tienes repetidas.
          </p>
        </div>
        <nav aria-label="Información del sitio">
          <ul className="flex flex-col sm:items-end">
            {FOOTER_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className={linkClass}>
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              <a href={`mailto:${SITE.contactEmail}`} className={linkClass}>
                {SITE.contactEmail}
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <p className="type-caption mx-auto w-full max-w-5xl px-4 pb-6 text-muted">
        © {year} {SITE.name} · Hecho en {SITE.country}. Sitio independiente, sin relación con las editoriales de los álbumes.
      </p>
    </footer>
  );
}
