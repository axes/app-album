import Link from "next/link";

export default function HomePage() {
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-3xl font-semibold">App Album</h1>
      <p className="text-neutral-600">
        Base M0: registro, login y área protegida.
      </p>
      <nav className="flex gap-3">
        <Link
          className="rounded bg-neutral-900 px-4 py-2 text-white"
          href="/register"
        >
          Crear cuenta
        </Link>
        <Link
          className="rounded border border-neutral-300 px-4 py-2"
          href="/login"
        >
          Iniciar sesión
        </Link>
      </nav>
    </section>
  );
}
