import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type postgres from "postgres";
import type { DrizzleAdminUserRepository } from "./drizzle-repository";
import type { AdminOperationError } from "./service";

/**
 * Integration coverage for the self-protection rule in the real PostgreSQL
 * repository.
 *
 * The unit tests in `policy.test.ts` prove the rule itself; this suite proves
 * that the repository actually calls it inside the transaction, so a crafted
 * request cannot demote or block the administrator who sent it. That cannot be
 * reproduced with an in-memory adapter, so the suite is skipped unless
 * DATABASE_URL points at a disposable local database, and every server-only
 * module is imported dynamically so the default unit run never touches the
 * database client.
 */
const url = process.env.DATABASE_URL;
const suite = url ? describe : describe.skip;

suite("drizzle admin user repository — self-protection (integration)", () => {
  let sql: ReturnType<typeof postgres>;
  const stamp = Date.now();
  let repository: DrizzleAdminUserRepository;
  let actorId = "";
  let otherAdminId = "";
  const createdIds: string[] = [];

  async function createUser(
    username: string,
    role: "admin" | "user",
    status: "active" | "banned",
  ): Promise<string> {
    const [row] = await sql`
      insert into users (username, email, email_owner_type, role, status, password_hash)
      values (
        ${username},
        ${`${username}@example.com`},
        'self', ${role}, ${status}, 'x'
      )
      returning id`;
    createdIds.push(row.id as string);
    return row.id as string;
  }

  async function errorCode(run: () => Promise<void>): Promise<string | null> {
    try {
      await run();
    } catch (error) {
      return (error as AdminOperationError).code ?? "unexpected";
    }
    return null;
  }

  beforeAll(async () => {
    const [{ default: createClient }, module] = await Promise.all([
      import("postgres"),
      import("./drizzle-repository"),
    ]);
    sql = createClient(url as string, { max: 1 });
    repository = new module.DrizzleAdminUserRepository();
    // Two active administrators, so the last-admin rule does not apply and the
    // self-protection rule is the only thing under test.
    actorId = await createUser(`it_self_actor_${stamp}`, "admin", "active");
    otherAdminId = await createUser(`it_self_other_${stamp}`, "admin", "active");
  });

  afterAll(async () => {
    if (createdIds.length > 0) {
      await sql`delete from user_admin_events where actor_user_id = any(${createdIds}) or target_user_id = any(${createdIds})`;
      await sql`delete from users where id = any(${createdIds})`;
    }
    await sql?.end({ timeout: 5 });
  });

  it("refuses to demote the acting administrator", async () => {
    expect(
      await errorCode(() =>
        repository.mutateUser(actorId, actorId, { type: "role", value: "user" }),
      ),
    ).toBe("self_mutation");

    const [row] = await sql`select role from users where id = ${actorId}`;
    expect(row.role).toBe("admin");
  });

  it("refuses to block the acting administrator", async () => {
    expect(
      await errorCode(() =>
        repository.mutateUser(actorId, actorId, { type: "status", value: "banned" }),
      ),
    ).toBe("self_mutation");

    const [row] = await sql`select status from users where id = ${actorId}`;
    expect(row.status).toBe("active");
  });

  it("still allows mutating another administrator", async () => {
    await repository.mutateUser(actorId, otherAdminId, { type: "role", value: "user" });

    const [row] = await sql`select role from users where id = ${otherAdminId}`;
    expect(row.role).toBe("user");
  });

  it("records no audit row for a rejected self-mutation", async () => {
    const [row] = await sql`
      select count(*)::int as total from user_admin_events
      where actor_user_id = ${actorId} and target_user_id = ${actorId}`;
    expect(row.total).toBe(0);
  });
});
