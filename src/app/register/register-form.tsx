"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction, type RegisterState } from "./actions";

const initialState: RegisterState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerAction,
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
        <span className="text-sm font-medium">Email</span>
        <input
          className="rounded border border-neutral-300 px-3 py-2"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">¿A quién pertenece este email?</span>
        <select
          className="rounded border border-neutral-300 px-3 py-2"
          name="emailOwnerType"
          required
          defaultValue="self"
        >
          <option value="self">A mí</option>
          <option value="parent">A mi padre o madre</option>
          <option value="guardian">A mi tutor/a</option>
          <option value="other">A otro contacto</option>
        </select>
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium">Contraseña</span>
        <input
          className="rounded border border-neutral-300 px-3 py-2"
          name="password"
          type="password"
          autoComplete="new-password"
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
        {pending ? "Creando…" : "Crear cuenta"}
      </button>
      <Link className="text-sm underline" href="/login">
        Ya tengo cuenta
      </Link>
    </form>
  );
}
