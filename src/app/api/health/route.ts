import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db/client";

/**
 * Liveness/readiness probe for infrastructure.
 *
 * Deliberately minimal: it returns only a status flag and never exposes the
 * host, database name, versions, connection string or any secret. The database
 * round-trip is a single `select 1`, cheap enough to be polled.
 *
 * - 200 `{ "status": "ok" }`          → process up and database reachable.
 * - 503 `{ "status": "unavailable" }` → database unreachable.
 *
 * `force-dynamic` + `no-store` keep the probe out of every cache layer so a
 * stale "ok" can never be served after the database goes down.
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" } as const;

export async function GET() {
  try {
    await db.execute(sql`select 1`);
  } catch {
    return NextResponse.json({ status: "unavailable" }, { status: 503, headers: NO_STORE });
  }

  return NextResponse.json({ status: "ok" }, { headers: NO_STORE });
}
