"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";

/**
 * Logout as a Server Action: Next.js validates Origin/Host for Server Actions,
 * so no extra CSRF token is required for this state-changing POST.
 */
export async function logoutAction(): Promise<void> {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}
