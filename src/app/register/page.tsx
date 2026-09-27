import { RegisterForm } from "./register-form";

// The register Server Action uses @node-rs/argon2 (native) and iron-session, so
// this route must run on the Node.js runtime, not Edge.
export const runtime = "nodejs";

export default function RegisterPage() {
  return (
    <section className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Crear cuenta</h1>
      <RegisterForm />
    </section>
  );
}
