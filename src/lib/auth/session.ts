import "server-only";
import { cookies } from "next/headers";
import { getIronSession, type IronSession } from "iron-session";
import { env } from "@/lib/env";
import {
  buildSessionOptions,
  type SessionData,
} from "./session-options";

export type { SessionData } from "./session-options";
export {
  SESSION_COOKIE_NAME,
  SESSION_TTL_SECONDS,
} from "./session-options";

export function getSessionOptions() {
  return buildSessionOptions(
    env.AUTH_SECRET,
    process.env.NODE_ENV === "production",
  );
}

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, getSessionOptions());
}
