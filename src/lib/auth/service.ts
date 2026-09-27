import { z } from "zod";
import { loginSchema, registrationSchema } from "./credentials";
import {
  EmailTakenError,
  InvalidCredentialsError,
  UsernameTakenError,
} from "./errors";
import {
  DUMMY_PASSWORD_HASH,
  hashPassword,
  verifyPassword,
} from "./password";
import type { UserRecord, UserRepository } from "./repository";

export type AuthenticatedUser = {
  id: string;
  username: string;
  role: "user" | "admin";
  status: "active";
};

const uuidSchema = z.string().uuid();

function uniqueConstraint(error: unknown): string | null {
  if (typeof error !== "object" || error === null) {
    return null;
  }
  if ((error as { code?: unknown }).code !== "23505") {
    return null;
  }
  const constraint = (error as { constraint_name?: unknown }).constraint_name;
  return typeof constraint === "string" && constraint.length > 0
    ? constraint
    : "unknown_unique";
}

export class AuthService {
  constructor(private readonly users: UserRepository) {}

  async register(input: unknown): Promise<AuthenticatedUser> {
    const parsed = registrationSchema.safeParse(input);
    if (!parsed.success) {
      throw new InvalidCredentialsError();
    }

    const { username, email, emailOwnerType, password } = parsed.data;

    if (await this.users.findByUsername(username)) {
      throw new UsernameTakenError();
    }
    if (await this.users.findByEmail(email)) {
      throw new EmailTakenError();
    }

    const passwordHash = await hashPassword(password);

    try {
      const user = await this.users.createUser({
        username,
        email,
        emailOwnerType,
        passwordHash,
        role: "user",
        status: "active",
      });
      return this.toAuthenticatedUser(user);
    } catch (error) {
      const constraint = uniqueConstraint(error);
      if (constraint === "users_username_unique" || constraint === "unknown_unique") {
        throw new UsernameTakenError();
      }
      if (constraint === "users_email_unique") {
        throw new EmailTakenError();
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
    if (!valid || user.status !== "active") {
      throw new InvalidCredentialsError();
    }

    return this.toAuthenticatedUser(user);
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
    if (!user || user.status !== "active") {
      return null;
    }

    return this.toAuthenticatedUser(user);
  }

  private toAuthenticatedUser(user: UserRecord): AuthenticatedUser {
    if (!user || user.status !== "active") {
      throw new InvalidCredentialsError();
    }
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      status: "active",
    };
  }
}
