import { describe, expect, it } from "vitest";
import {
  AdminOperationError,
  AdminUserService,
  type AdminMutation,
  type AdminUser,
  type AdminUserRepository,
} from "./service";

const ACTOR_ID = "00000000-0000-4000-8000-000000000001";
const TARGET_ID = "00000000-0000-4000-8000-000000000002";

class RecordingRepository implements AdminUserRepository {
  mutations: Array<{ actorId: string; targetId: string; mutation: AdminMutation }> = [];
  async listUsers(): Promise<AdminUser[]> {
    return [];
  }
  async mutateUser(actorId: string, targetId: string, mutation: AdminMutation) {
    this.mutations.push({ actorId, targetId, mutation });
  }
}

describe("AdminUserService", () => {
  it("dispatches promotion, degradation, blocking and unblocking", async () => {
    const repository = new RecordingRepository();
    const service = new AdminUserService(repository);

    await service.changeRole(ACTOR_ID, TARGET_ID, "admin");
    await service.changeRole(ACTOR_ID, TARGET_ID, "user");
    await service.changeStatus(ACTOR_ID, TARGET_ID, "banned");
    await service.changeStatus(ACTOR_ID, TARGET_ID, "active");

    expect(repository.mutations.map(({ mutation }) => mutation)).toEqual([
      { type: "role", value: "admin" },
      { type: "role", value: "user" },
      { type: "status", value: "banned" },
      { type: "status", value: "active" },
    ]);
  });

  it("rejects malformed ids and unsupported values before persistence", async () => {
    const repository = new RecordingRepository();
    const service = new AdminUserService(repository);

    await expect(service.changeRole("bad", TARGET_ID, "owner")).rejects.toMatchObject<AdminOperationError>({ code: "invalid_input" });
    await expect(service.changeStatus(ACTOR_ID, "bad", "disabled")).rejects.toMatchObject<AdminOperationError>({ code: "invalid_input" });
    expect(repository.mutations).toHaveLength(0);
  });
});
