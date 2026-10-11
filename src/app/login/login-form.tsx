"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { InlineMessage } from "@/components/ui/inline-message";
import { loginAction, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form action={formAction} aria-busy={pending} className="flex flex-col gap-4">
      <Field
        label="Usuario"
        name="username"
        autoComplete="username"
        required
        minLength={3}
        maxLength={30}
        pattern="[a-z0-9_]+"
        title="3 a 30 caracteres: letras minúsculas, números y guion bajo"
      />
      <Field
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="current-password"
        required
        minLength={10}
        maxLength={128}
      />
      {state.error ? (
        <InlineMessage variant="error">{state.error}</InlineMessage>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Ingresando…" : "Iniciar sesión"}
      </Button>
      <Link className="text-sm text-primary underline" href="/register">
        Crear una cuenta
      </Link>
    </form>
  );
}
