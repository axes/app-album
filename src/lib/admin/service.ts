import { z } from "zod";
import type { EmailOwnerType, UserRole, UserStatus } from "@/lib/db/schema";

export type AdminUser = {
  id: string;
  username: string;
  email: string;
  emailOwnerType: EmailOwnerType;
  role: UserRole;
  status: UserStatus;
};

export type AdminMutation =
  | { type: "role"; value: UserRole }
  | { type: "status"; value: UserStatus };

export interface AdminUserRepository {
  listUsers(): Promise<AdminUser[]>;
  mutateUser(actorId: string, targetId: string, mutation: AdminMutation): Promise<void>;
}

export class AdminOperationError extends Error {
  constructor(
    public readonly code:
      | "invalid_input"
      | "forbidden"
      | "not_found"
      | "last_active_admin",
  ) {
    super(code);
    this.name = "AdminOperationError";
  }
}

const uuidSchema = z.string().uuid();
const roleSchema = z.enum(["user", "admin"]);
const statusSchema = z.enum(["active", "banned"]);

export class AdminUserService {
  constructor(private readonly users: AdminUserRepository) {}

  listUsers() {
    return this.users.listUsers();
  }

  async changeRole(actorId: unknown, targetId: unknown, role: unknown) {
    const actor = uuidSchema.safeParse(actorId);
    const target = uuidSchema.safeParse(targetId);
    const value = roleSchema.safeParse(role);
    if (!actor.success || !target.success || !value.success) {
      throw new AdminOperationError("invalid_input");
    }
    await this.users.mutateUser(actor.data, target.data, {
      type: "role",
      value: value.data,
    });
  }

  async changeStatus(actorId: unknown, targetId: unknown, status: unknown) {
    const actor = uuidSchema.safeParse(actorId);
    const target = uuidSchema.safeParse(targetId);
    const value = statusSchema.safeParse(status);
    if (!actor.success || !target.success || !value.success) {
      throw new AdminOperationError("invalid_input");
    }
    await this.users.mutateUser(actor.data, target.data, {
      type: "status",
      value: value.data,
    });
  }
}
