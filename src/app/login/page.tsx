import { AppShell } from "@/components/ui/app-shell";
import { PageHeader } from "@/components/ui/page-header";
import { LoginForm } from "./login-form";

// The login Server Action uses @node-rs/argon2 (native) and iron-session, so
// this route must run on the Node.js runtime, not Edge.
export const runtime = "nodejs";

export default function LoginPage() {
  return (
    <AppShell>
      <section className="mx-auto flex w-full max-w-md flex-col gap-6 rounded-card border border-border bg-surface p-6">
        <PageHeader
          title="Iniciar sesión"
          description="Accede a tus álbumes y continúa organizando tu colección."
        />
        <LoginForm />
      </section>
    </AppShell>
  );
}
