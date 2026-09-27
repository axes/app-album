import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@/lib/env";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as {
  __appAlbumSql?: ReturnType<typeof postgres>;
};

const sql = globalForDb.__appAlbumSql ?? postgres(env.DATABASE_URL, { max: 1 });

if (process.env.NODE_ENV !== "production") {
  globalForDb.__appAlbumSql = sql;
}

export const db = drizzle(sql, { schema });
