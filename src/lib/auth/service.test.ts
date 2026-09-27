import { describe, expect, it } from "vitest";
import { AuthService } from "./service";
import {
  EmailTakenError,
  InvalidCredentialsError,
  UsernameTakenError,
} from "./errors";
import type {
  CreateUserInput,
  UserRecord,
  UserRepository,
} from "./repository";

class InMemoryUserRepository implements UserRepository {
  private readonly rows = new Map<string, UserRecord>();
  private counter = 0;
  public findByIdCalls = 0;
  public findByUsernameCalls = 0;
  public findByEmailCalls = 0;

  constructor(private readonly failWith?: unknown) {}

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
    this.findByUsernameCalls += 1;
    return this.rows.get(username) ?? null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    this.findByEmailCalls += 1;
    return [...this.rows.values()].find((row) => row.email === email) ?? null;
  }

  async createUser(input: CreateUserInput): Promise<UserRecord> {
    if (this.failWith) {
      throw this.failWith;
    }
    if (this.rows.has(input.username)) {
      const error = Object.assign(new Error("duplicate"), { code: "23505" });
      throw error;
    }
    this.counter += 1;
    const now = new Date();
    const record: UserRecord = {
      id: `00000000-0000-4000-8000-${String(this.counter).padStart(12, "0")}`,
      username: input.username,
      email: input.email,
      emailOwnerType: input.emailOwnerType,
      role: input.role,
      status: input.status,
      passwordHash: input.passwordHash,
      createdAt: now,
      updatedAt: now,
    };
    this.rows.set(input.username, record);
    return record;
  }
}

describe("AuthService.register", () => {
  it("stores only a hash and returns the new user id", async () => {
    const repo = new InMemoryUserRepository();
    const service = new AuthService(repo);

    const user = await service.register({
      username: "  Alice_01 ",
      email: "  Alice@Example.COM ",
      emailOwnerType: "self",
      password: "super-secret-1",
    });

    expect(user.username).toBe("alice_01");
    expect(user.id).toMatch(/^[0-9a-f-]{36}$/);

    const stored = await repo.findByUsername("alice_01");
    expect(stored).not.toBeNull();
    expect(stored?.email).toBe("alice@example.com");
    expect(stored?.role).toBe("user");
    expect(stored?.status).toBe("active");
    expect(stored?.passwordHash).not.toBe("super-secret-1");
    expect(stored?.passwordHash.startsWith("$argon2id$")).toBe(true);
  });

  it("rejects invalid credentials before touching the repository", async () => {
    const repo = new InMemoryUserRepository();
    const service = new AuthService(repo);

    await expect(
      service.register({ username: "ab", password: "super-secret-1" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    await expect(
      service.register({ username: "valid_name", password: "short" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(repo.findByUsernameCalls).toBe(0);
  });

  it("rejects a username that already exists", async () => {
    const repo = new InMemoryUserRepository();
    const service = new AuthService(repo);

    await service.register({
      username: "taken",
      email: "taken@example.com",
      emailOwnerType: "self",
      password: "super-secret-1",
    });
    await expect(
      service.register({
        username: "taken",
        email: "other@example.com",
        emailOwnerType: "self",
        password: "another-secret-1",
      }),
    ).rejects.toBeInstanceOf(UsernameTakenError);
  });

  it("rejects a duplicate normalized email", async () => {
    const repo = new InMemoryUserRepository();
    const service = new AuthService(repo);
    await service.register({
      username: "first",
      email: "person@example.com",
      emailOwnerType: "self",
      password: "super-secret-1",
    });

    await expect(
      service.register({
        username: "second",
        email: " PERSON@EXAMPLE.COM ",
        emailOwnerType: "other",
        password: "super-secret-2",
      }),
    ).rejects.toBeInstanceOf(EmailTakenError);
  });

  it("maps a concurrent unique violation to UsernameTakenError", async () => {
    const duplicate = Object.assign(new Error("duplicate"), { code: "23505" });
    const repo = new InMemoryUserRepository(duplicate);
    const service = new AuthService(repo);

    await expect(
      service.register({
        username: "racer",
        email: "racer@example.com",
        emailOwnerType: "self",
        password: "super-secret-1",
      }),
    ).rejects.toBeInstanceOf(UsernameTakenError);
  });

  it("ignores a 23505 raised by an unrelated constraint", async () => {
    const duplicate = Object.assign(new Error("duplicate"), {
      code: "23505",
      constraint_name: "some_other_unique",
    });
    const repo = new InMemoryUserRepository(duplicate);
    const service = new AuthService(repo);

    await expect(
      service.register({
        username: "racer",
        email: "racer@example.com",
        emailOwnerType: "self",
        password: "super-secret-1",
      }),
    ).rejects.toBe(duplicate);
  });

  it("propagates unexpected repository errors", async () => {
    const boom = new Error("connection lost");
    const repo = new InMemoryUserRepository(boom);
    const service = new AuthService(repo);

    await expect(
      service.register({
        username: "racer",
        email: "racer@example.com",
        emailOwnerType: "self",
        password: "super-secret-1",
      }),
    ).rejects.toBe(boom);
  });
});

describe("AuthService.login", () => {
  async function setup() {
    const repo = new InMemoryUserRepository();
    const service = new AuthService(repo);
    const user = await service.register({
      username: "carol",
      email: "carol@example.com",
      emailOwnerType: "self",
      password: "super-secret-1",
    });
    return { repo, service, user };
  }

  it("returns the user id for valid credentials", async () => {
    const { service, user } = await setup();
    const result = await service.login({
      username: "carol",
      password: "super-secret-1",
    });
    expect(result).toEqual({
      id: user.id,
      username: "carol",
      role: "user",
      status: "active",
    });
  });

  it("normalizes the username on login", async () => {
    const { service, user } = await setup();
    const result = await service.login({
      username: "  CAROL ",
      password: "super-secret-1",
    });
    expect(result.id).toBe(user.id);
  });

  it("throws a generic error for a wrong password", async () => {
    const { service } = await setup();
    await expect(
      service.login({ username: "carol", password: "wrong-password" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it("throws the same generic error for an unknown user", async () => {
    const { service } = await setup();
    await expect(
      service.login({ username: "nobody", password: "super-secret-1" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it("does not leak which field failed", async () => {
    const { service } = await setup();
    const wrongPassword = await service
      .login({ username: "carol", password: "wrong-password" })
      .catch((error: Error) => error.message);
    const unknownUser = await service
      .login({ username: "nobody", password: "super-secret-1" })
      .catch((error: Error) => error.message);
    expect(wrongPassword).toBe(unknownUser);
  });

  it("applies the same username/password rules as registration", async () => {
    const { service } = await setup();
    await expect(
      service.login({ username: "ab", password: "super-secret-1" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    await expect(
      service.login({ username: "carol", password: "short" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    await expect(
      service.login({ username: "bad-name", password: "super-secret-1" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it("does not query the repository for invalid input", async () => {
    const { repo, service } = await setup();
    const before = repo.findByUsernameCalls;

    await expect(
      service.login({ username: "ab", password: "super-secret-1" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    await expect(
      service.login({ username: "carol", password: "short" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    await expect(
      service.login({ username: 42, password: null }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);

    expect(repo.findByUsernameCalls).toBe(before);
  });

  it("returns the same generic error for invalid input and bad credentials", async () => {
    const { service } = await setup();
    const invalidInput = await service
      .login({ username: "ab", password: "super-secret-1" })
      .catch((error: Error) => error.message);
    const wrongPassword = await service
      .login({ username: "carol", password: "wrong-password" })
      .catch((error: Error) => error.message);
    expect(invalidInput).toBe(wrongPassword);
  });
});

describe("AuthService.resolveUserById", () => {
  async function setup() {
    const repo = new InMemoryUserRepository();
    const service = new AuthService(repo);
    const user = await service.register({
      username: "dave",
      email: "dave@example.com",
      emailOwnerType: "self",
      password: "super-secret-1",
    });
    return { repo, service, user };
  }

  it("resolves an existing user from a valid UUID", async () => {
    const { service, user } = await setup();
    const resolved = await service.resolveUserById(user.id);
    expect(resolved).toEqual({
      id: user.id,
      username: "dave",
      role: "user",
      status: "active",
    });
  });

  it("returns null for a malformed id without querying the repository", async () => {
    const { repo, service } = await setup();
    const before = repo.findByIdCalls;

    await expect(service.resolveUserById("not-a-uuid")).resolves.toBeNull();
    await expect(service.resolveUserById("")).resolves.toBeNull();
    await expect(service.resolveUserById(undefined)).resolves.toBeNull();
    await expect(service.resolveUserById(123)).resolves.toBeNull();

    expect(repo.findByIdCalls).toBe(before);
  });

  it("returns null for a well-formed but unknown UUID", async () => {
    const { service } = await setup();
    await expect(
      service.resolveUserById("11111111-1111-4111-8111-111111111111"),
    ).resolves.toBeNull();
  });
});

describe("banned account authorization", () => {
  it("rejects login and existing-session resolution for a banned user", async () => {
    const repo = new InMemoryUserRepository();
    const service = new AuthService(repo);
    const created = await service.register({
      username: "blocked",
      email: "blocked@example.com",
      emailOwnerType: "self",
      password: "super-secret-1",
    });
    const stored = await repo.findByUsername("blocked");
    if (!stored) throw new Error("missing test user");
    stored.status = "banned";

    await expect(
      service.login({ username: "blocked", password: "super-secret-1" }),
    ).rejects.toBeInstanceOf(InvalidCredentialsError);
    await expect(service.resolveUserById(created.id)).resolves.toBeNull();
  });
});
