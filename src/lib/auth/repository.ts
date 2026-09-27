import type { EmailOwnerType, UserRole, UserStatus } from "@/lib/db/schema";

export type UserRecord = {
  id: string;
  username: string;
  email: string;
  emailOwnerType: EmailOwnerType;
  role: UserRole;
  status: UserStatus;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserInput = {
  username: string;
  email: string;
  emailOwnerType: EmailOwnerType;
  role: "user";
  status: "active";
  passwordHash: string;
};

/**
 * Storage-agnostic contract for user persistence. The auth service depends on
 * this interface only, so it can be exercised without a database.
 */
export interface UserRepository {
  findById(id: string): Promise<UserRecord | null>;
  findByUsername(username: string): Promise<UserRecord | null>;
  findByEmail(email: string): Promise<UserRecord | null>;
  createUser(input: CreateUserInput): Promise<UserRecord>;
}
