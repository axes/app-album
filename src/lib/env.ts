import "server-only";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(32, "AUTH_SECRET must be at least 32 characters"),
});

const parsed = envSchema.safeParse({
  DATABASE_URL: process.env.DATABASE_URL,
  AUTH_SECRET: process.env.AUTH_SECRET,
});

if (!parsed.success) {
  const missing = parsed.error.issues
    .map((issue) => issue.path.join(".") || "env")
    .join(", ");
  throw new Error(`Invalid server environment variables: ${missing}`);
}

export const env = parsed.data;
