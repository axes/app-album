import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";
import type { CreateUserInput, UserRecord, UserRepository } from "./repository";

function toRecord(row: typeof users.$inferSelect): UserRecord {
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.passwordHash,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleUserRepository implements UserRepository {
  async findById(id: string): Promise<UserRecord | null> {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    const row = rows[0];
    return row ? toRecord(row) : null;
  }

  async findByUsername(username: string): Promise<UserRecord | null> {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);

    const row = rows[0];
    return row ? toRecord(row) : null;
  }

  async createUser(input: CreateUserInput): Promise<UserRecord> {
    const rows = await db
      .insert(users)
      .values({
        username: input.username,
        passwordHash: input.passwordHash,
      })
      .returning();

    const row = rows[0];
    if (!row) {
      throw new Error("Failed to create user");
    }
    return toRecord(row);
  }
}
