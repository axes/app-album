import { AppShell } from "@/components/ui/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { RegisterForm } from "./register-form";

// The register Server Action uses @node-rs/argon2 (native) and iron-session, so
// this route must run on the Node.js runtime, not Edge.
export const runtime = "nodejs";

export default function RegisterPage() {
  return (
    <AppShell>
      <section className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-card border border-border bg-surface p-6">
        <PageHeader
          title="Crear cuenta"
          description="Crea tu espacio para llevar el control de tus álbumes y láminas."
        />
        <RegisterForm />
      </section>
    </AppShell>
  );
}
