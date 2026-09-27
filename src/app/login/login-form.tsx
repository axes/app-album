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
          className="rounded border border-input-border bg-input px-3 py-2 text-content"
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
          className="rounded border border-input-border bg-input px-3 py-2 text-content"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={10}
          maxLength={128}
        />
      </label>
      {state.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      <button
        className="rounded bg-primary px-4 py-2 text-primary-text disabled:opacity-50"
        type="submit"
        disabled={pending}
      >
        {pending ? "Ingresando…" : "Iniciar sesión"}
      </button>
      <Link className="text-sm text-primary underline" href="/register">
        Crear una cuenta
      </Link>
    </form>
  );
}
