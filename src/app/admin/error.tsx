"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/error-state";

/**
 * UI-06B — error boundary for the administration segment.
 *
 * It covers `/admin/albums`, `/admin/albums/[id]`, `/admin/albums/new` and
 * `/admin/users`. The admin layout already redirects non-admins to `/app`
 * before rendering children, so this boundary only sees unexpected failures.
 *
 * `error` is declared for the Next.js contract and never destructured: no
 * `message`, no `stack`, no `digest` reaches the user. No `console.error`
 * either — the project has no accepted logging pattern.
 *
 * The secondary action points to `/app`, an authenticated route that is always
 * valid for whoever is looking at the panel. Public routes (`/`, `/login`,
 * `/register`) are deliberately not offered here.
 */
export default function AdminError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
            <Link href="/app">Volver a mis álbumes</Link>
          </Button>
        </>
      }
    />
  );
}
