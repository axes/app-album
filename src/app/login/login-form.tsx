"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Usuario</span>
        <input
          className="rounded border border-neutral-300 px-3 py-2"
          name="username"
          autoComplete="username"
          required
          minLength={3}
          maxLength={30}
          pattern="[a-z0-9_]+"
          title="3 a 30 caracteres: letras minúsculas, números y guion bajo"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Contraseña</span>
        <input
          className="rounded border border-neutral-300 px-3 py-2"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={10}
          maxLength={128}
        />
      </label>
      {state.error ? (
        <p className="text-sm text-red-600" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        className="rounded bg-neutral-900 px-4 py-2 text-white disabled:opacity-50"
        type="submit"
        disabled={pending}
      >
        {pending ? "Ingresando…" : "Iniciar sesión"}
      </button>
      <Link className="text-sm underline" href="/register">
        Crear una cuenta
      </Link>
    </form>
  );
}
