import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { LogoPlaceholder } from "@/components/ui/logo-placeholder";
import { Button } from "@/components/ui/button";

/**
 * Empty state for `/app` when the user has no albums in their collection.
 *
 * Server Component. Reuses the `EmptyState`, `LogoPlaceholder` and
 * `Button` primitives from UI-05A so the visual outcome stays aligned
 * with the rest of the design system. The CTA deep-links into the
 * "Explorar álbumes" view where they can pick something to start with.
 */
export type EmptyLibraryProps = {
  username: string | null;
};

export function EmptyLibrary({ username }: EmptyLibraryProps) {
  return (
    <EmptyState
      title="Tu colección está vacía"
      description={
        username
          ? `Hola, ${username}. Añade tu primer álbum para empezar a registrar tus láminas.`
          : "Añade tu primer álbum para empezar a registrar tus láminas."
      }
      icon={<LogoPlaceholder className="size-16" />}
      action={
        <Button asChild>
          <Link href="/app/albums">Explorar álbumes</Link>
        </Button>
      }
    />
  );
}
