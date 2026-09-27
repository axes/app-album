import type { AuthenticatedUser } from "@/lib/auth/service";

export function isActiveAdmin(
  user: AuthenticatedUser | null,
): user is AuthenticatedUser & { role: "admin" } {
  return user?.role === "admin" && user.status === "active";
}
