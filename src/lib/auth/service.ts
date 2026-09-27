import { z } from "zod";
import { credentialsSchema, loginSchema } from "./credentials";
import { InvalidCredentialsError, UsernameTakenError } from "./errors";
import {
  DUMMY_PASSWORD_HASH,
  hashPassword,
  verifyPassword,
} from "./password";
import type { UserRepository } from "./repository";

export type AuthenticatedUser = {
  id: string;
  username: string;
};

const uuidSchema = z.string().uuid();

function isUniqueViolation(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }
  const code = (error as { code?: unknown }).code;
  if (code !== "23505") {
    return false;
  }
  // When the driver exposes the constraint name, make sure it is the one we
  // expect so unrelated unique violations are not misreported.
  const constraint = (error as { constraint_name?: unknown }).constraint_name;
  if (typeof constraint === "string" && constraint.length > 0) {
    return constraint === "users_username_unique";
  }
  return true;
}

export class AuthService {
  constructor(private readonly users: UserRepository) {}

  async register(input: unknown): Promise<AuthenticatedUser> {
    const parsed = credentialsSchema.safeParse(input);
    if (!parsed.success) {
      throw new InvalidCredentialsError();
    }

    const { username, password } = parsed.data;

    const existing = await this.users.findByUsername(username);
    if (existing) {
      throw new UsernameTakenError();
    }

    const passwordHash = await hashPassword(password);

    try {
      const user = await this.users.createUser({ username, passwordHash });
      return { id: user.id, username: user.username };
    } catch (error) {
      // Concurrent duplicate registration: the unique constraint wins.
      if (isUniqueViolation(error)) {
        throw new UsernameTakenError();
      }
      throw error;
    }
  }

  async login(input: unknown): Promise<AuthenticatedUser> {
    const parsed = loginSchema.safeParse(input);

    if (!parsed.success) {
      // Invalid input never reaches the database, but we still perform one
      // dummy verification so the response time matches a real attempt.
      await verifyPassword(DUMMY_PASSWORD_HASH, "");
      throw new InvalidCredentialsError();
    }

    const { username, password } = parsed.data;

    const user = await this.users.findByUsername(username);
    if (!user) {
      await verifyPassword(DUMMY_PASSWORD_HASH, password);
      throw new InvalidCredentialsError();
    }

    const valid = await verifyPassword(user.passwordHash, password);
    if (!valid) {
      throw new InvalidCredentialsError();
    }

    return { id: user.id, username: user.username };
  }

  /**
   * Resolves the current user from a session-stored id. The id is validated
   * as a UUID before hitting the database, and the user must still exist.
   * Returns null for malformed, unknown or orphaned ids.
   */
  async resolveUserById(id: unknown): Promise<AuthenticatedUser | null> {
    const parsed = uuidSchema.safeParse(id);
    if (!parsed.success) {
      return null;
    }

    const user = await this.users.findById(parsed.data);
    if (!user) {
      return null;
    }

    return { id: user.id, username: user.username };
  }
}
