"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

/**
 * UI-06B — error boundary for the authenticated experience.
 *
 * It covers `/app`, `/app/albums` and `/app/albums/[userAlbumId]`, and any
 * future descendant that does not declare its own boundary. The album detail
 * route deliberately has no boundary of its own: it already redirects on
 * `forbidden` / `not_found` / `invalid_input` and re-throws everything else, so
 * this boundary only ever sees unexpected failures.
 *
 * `error` is part of the Next.js contract and is declared for that reason, but
 * it is never destructured: neither `message`, nor `stack`, nor `digest` is
 * rendered. There is no `console.error` either — the project has no accepted
 * logging pattern and Next.js already reports the error server-side.
 *
 * `reset()` is the retry. `window.location.reload()` is not used: a real retry
 * re-renders the segment, and if the server is still failing the secondary link
 * is the way out.
 *
 * The secondary action depends on the current route so that no page links to
 * itself: on `/app` it points to the catalogue, everywhere else back to the
 * collection.
 */
export default function AppError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const secondary =
    pathname === "/app"
      ? { href: "/app/albums", label: "Explorar álbumes" }
      : { href: "/app", label: "Volver a mis álbumes" };

  return (
    <ErrorState
      title="Algo salió mal"
      description="No pudimos cargar esta sección. Puedes intentar nuevamente."
      actions={
        <>
          <Button type="button" onClick={() => reset()}>
            Reintentar
          </Button>
          <Button asChild variant="secondary">
            <Link href={secondary.href}>{secondary.label}</Link>
          </Button>
        </>
      }
    />
  );
}
