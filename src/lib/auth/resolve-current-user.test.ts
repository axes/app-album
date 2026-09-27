import { describe, expect, it, vi } from "vitest";
import { AuthService, type AuthenticatedUser } from "./service";
import type {
  CreateUserInput,
  UserRecord,
  UserRepository,
} from "./repository";
import { resolveCurrentUser, type UserResolver } from "./resolve-current-user";

class InMemoryUserRepository implements UserRepository {
  private readonly rows = new Map<string, UserRecord>();
  private counter = 0;
  public findByIdCalls = 0;

  async findById(id: string): Promise<UserRecord | null> {
    this.findByIdCalls += 1;
    for (const row of this.rows.values()) {
      if (row.id === id) {
        return row;
      }
    }
    return null;
  }

  async findByUsername(username: string): Promise<UserRecord | null> {
    return this.rows.get(username) ?? null;
  }

  async createUser(input: CreateUserInput): Promise<UserRecord> {
    this.counter += 1;
    const now = new Date();
    const record: UserRecord = {
      id: `00000000-0000-4000-8000-${String(this.counter).padStart(12, "0")}`,
      username: input.username,
      passwordHash: input.passwordHash,
      createdAt: now,
      updatedAt: now,
    };
    this.rows.set(input.username, record);
    return record;
  }
}

async function setup() {
  const repo = new InMemoryUserRepository();
  const service = new AuthService(repo);
  const user = await service.register({
    username: "erin",
    password: "super-secret-1",
  });
  const resolver: UserResolver = (id) => service.resolveUserById(id);
  return { repo, service, user, resolver };
}

describe("resolveCurrentUser", () => {
  it("returns null for an absent session id without calling the resolver", async () => {
    const resolver = vi.fn<UserResolver>().mockResolvedValue(null);

    await expect(resolveCurrentUser(undefined, resolver)).resolves.toBeNull();
    await expect(resolveCurrentUser("", resolver)).resolves.toBeNull();

    expect(resolver).not.toHaveBeenCalled();
  });

  it("returns null for a malformed id without querying the repository", async () => {
    const { repo, resolver } = await setup();
    const before = repo.findByIdCalls;

    await expect(resolveCurrentUser("not-a-uuid", resolver)).resolves.toBeNull();
    await expect(resolveCurrentUser(123, resolver)).resolves.toBeNull();

    expect(repo.findByIdCalls).toBe(before);
  });

  it("returns null for a well-formed but orphaned UUID", async () => {
    const { resolver } = await setup();

    await expect(
      resolveCurrentUser("11111111-1111-4111-8111-111111111111", resolver),
    ).resolves.toBeNull();
  });

  it("returns the user for an existing session id", async () => {
    const { user, resolver } = await setup();

    const resolved = await resolveCurrentUser(user.id, resolver);

    expect(resolved).toEqual({ id: user.id, username: "erin" });
  });

  it("delegates the lookup to the injected resolver only", async () => {
    const sentinel: AuthenticatedUser = { id: "sentinel", username: "sentinel" };
    const resolver = vi.fn<UserResolver>().mockResolvedValue(sentinel);

    const resolved = await resolveCurrentUser("some-id", resolver);

    expect(resolved).toBe(sentinel);
    expect(resolver).toHaveBeenCalledTimes(1);
    expect(resolver).toHaveBeenCalledWith("some-id");
  });
});
