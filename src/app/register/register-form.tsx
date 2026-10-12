"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { InlineMessage } from "@/components/ui/inline-message";
import { registerAction, type RegisterState } from "./actions";

const initialState: RegisterState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerAction,
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
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        required
        maxLength={254}
      />
      <Field
        as="select"
        label="¿A quién pertenece este email?"
        name="emailOwnerType"
        required
        defaultValue="self"
      >
        <option value="self">A mí</option>
        <option value="parent">A mi padre o madre</option>
        <option value="guardian">A mi tutor/a</option>
        <option value="other">A otro contacto</option>
      </Field>
      <Field
        label="Contraseña"
        name="password"
        type="password"
        autoComplete="new-password"
        required
        minLength={10}
        maxLength={128}
      />
      {state.error ? (
        <InlineMessage variant="error">{state.error}</InlineMessage>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Creando…" : "Crear cuenta"}
      </Button>
      <Link className="text-sm text-primary underline" href="/login">
        Ya tengo cuenta
      </Link>
    </form>
  );
}
