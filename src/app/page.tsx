import Link from "next/link";
import { AppShell } from "@/components/ui/app-shell";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";

export default function HomePage() {
  return (
    <AppShell>
      <section className="flex max-w-2xl flex-col gap-6 rounded-card border border-border bg-surface p-6 sm:p-8">
        <PageHeader
          title="MiColección"
          description="Organiza tus álbumes, registra tus láminas y revisa fácilmente cuáles te faltan o tienes repetidas."
        />
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
