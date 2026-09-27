import type { UserRole, UserStatus } from "@/lib/db/schema";
import { CatalogError } from "./service";

export function assertActiveAdmin(
  actor: { role: UserRole; status: UserStatus } | null,
): asserts actor is { role: "admin"; status: "active" } {
  if (!actor || actor.role !== "admin" || actor.status !== "active") {
    throw new CatalogError("forbidden");
  }
}
