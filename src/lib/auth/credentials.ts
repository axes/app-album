import { z } from "zod";

/**
 * Username rules: trimmed, lowercased, 3-30 chars, only [a-z0-9_].
 */
export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(
    z
      .string()
      .min(3, "El usuario debe tener al menos 3 caracteres")
      .max(30, "El usuario debe tener como máximo 30 caracteres")
      .regex(/^[a-z0-9_]+$/, "Sólo se permiten letras minúsculas, números y guion bajo"),
  );

/**
 * Password rules: 10-128 chars, no trimming (spaces are significant).
 */
export const passwordSchema = z
  .string()
  .min(10, "La contraseña debe tener al menos 10 caracteres")
  .max(128, "La contraseña debe tener como máximo 128 caracteres");

export const credentialsSchema = z.object({
  username: usernameSchema,
  password: passwordSchema,
});

/**
 * Login applies the exact same rules and limits as registration. The caller
 * must still surface a single generic error, so a rejected input is
 * indistinguishable from wrong credentials.
 */
export const loginSchema = credentialsSchema;

export type Credentials = z.infer<typeof credentialsSchema>;
