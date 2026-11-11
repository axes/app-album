import Link from "next/link";
import { AppShell } from "@/components/ui/app-shell";
import { Button } from "@/components/ui/button";
import { LogoOutline } from "@/components/ui/logo-outline";
import { SiteFooter } from "@/components/ui/site-footer";
import { Wordmark } from "@/components/ui/wordmark";

export default function HomePage() {
  return (
    <AppShell footer={<SiteFooter />}>
      <section className="flex max-w-2xl flex-col gap-6 rounded-card border border-border bg-surface p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
          {/* Decorative here: the heading next to it already names the site. */}
          <LogoOutline size={104} aria-hidden="true" className="shrink-0" />
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="text-content">
              <Wordmark />
            </h1>
            <p className="text-muted">
              Organiza tus álbumes, registra tus láminas y revisa fácilmente cuáles te faltan o tienes repetidas.
            </p>
          </div>
        </div>
        <nav aria-label="Acciones de acceso" className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/register">Crear cuenta</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/login">Iniciar sesión</Link>
          </Button>
        </nav>
      </section>
    </AppShell>
  );
}
