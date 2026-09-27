import "server-only";
import { and, asc, count, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { userAdminEvents, users } from "@/lib/db/schema";
import {
  type AdminMutation,
  type AdminUser,
  type AdminUserRepository,
} from "./service";
import { assertAdminMutationAllowed } from "./policy";

const ADMIN_LOCK_KEY = 741903;

function project(row: typeof users.$inferSelect): AdminUser {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    emailOwnerType: row.emailOwnerType,
    role: row.role,
    status: row.status,
  };
}

export class DrizzleAdminUserRepository implements AdminUserRepository {
  async listUsers(): Promise<AdminUser[]> {
    const rows = await db.select().from(users).orderBy(asc(users.username));
    return rows.map(project);
  }

  async mutateUser(actorId: string, targetId: string, mutation: AdminMutation): Promise<void> {
    await db.transaction(async (tx) => {
      // Serialize admin mutations so two concurrent requests cannot both remove
      // what each observed as a different "non-last" active administrator.
      await tx.execute(sql`select pg_advisory_xact_lock(${ADMIN_LOCK_KEY})`);

      const [actor] = await tx.select().from(users).where(eq(users.id, actorId)).limit(1);
      const [target] = await tx.select().from(users).where(eq(users.id, targetId)).limit(1);
      const [result] = await tx
        .select({ value: count() })
        .from(users)
        .where(and(eq(users.role, "admin"), eq(users.status, "active")));

      assertAdminMutationAllowed(
        actor ? project(actor) : null,
        target ? project(target) : null,
        mutation,
        result?.value ?? 0,
      );

      const previousValue = mutation.type === "role" ? target.role : target.status;
      if (previousValue === mutation.value) {
        return;
      }

      await tx
        .update(users)
        .set(
          mutation.type === "role"
            ? { role: mutation.value, updatedAt: new Date() }
            : { status: mutation.value, updatedAt: new Date() },
        )
        .where(eq(users.id, target.id));

      await tx.insert(userAdminEvents).values({
        actorUserId: actor.id,
        actorLabel: actor.username,
        targetUserId: target.id,
        action:
          mutation.type === "role"
            ? "role_change"
            : mutation.value === "banned"
              ? "block"
              : "unblock",
        previousValue,
        newValue: mutation.value,
      });
    });
  }
}
