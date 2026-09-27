import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";

export const runtime = "nodejs";

/**
 * Documented POST logout endpoint for clients that cannot submit a Server
 * Action (for example, non-JavaScript or external callers). The in-app UI uses
 * the `logoutAction` Server Action instead, which Next.js protects with its
 * built-in Origin/Host check. This handler is intentionally kept as a public,
 * documented route rather than dead code; see README ("Rutas disponibles").
 */
export async function POST(request: Request) {
  const session = await getSession();
  session.destroy();

  return NextResponse.redirect(new URL("/login", request.url), {
    status: 303,
  });
}
