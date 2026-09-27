export type UserRecord = {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
};

export type CreateUserInput = {
  username: string;
  passwordHash: string;
};

/**
 * Storage-agnostic contract for user persistence. The auth service depends on
 * this interface only, so it can be exercised without a database.
 */
export interface UserRepository {
  findById(id: string): Promise<UserRecord | null>;
  findByUsername(username: string): Promise<UserRecord | null>;
  createUser(input: CreateUserInput): Promise<UserRecord>;
}
