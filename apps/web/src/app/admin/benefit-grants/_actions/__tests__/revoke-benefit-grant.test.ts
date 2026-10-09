import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  mockGetClientIp,
  mockNotify,
  mockRecordModerationAction,
  mockRequireAdminActor,
  mockRevalidatePath,
  mockTransaction,
  setupAdminActor,
} from "@/test/admin-action-mocks";

const { mockRevokeBenefitGrant } = vi.hoisted(() => ({
  mockRevokeBenefitGrant: vi.fn(),
}));

vi.mock("next/cache", async () => await import("@/test/admin-action-mocks"));
vi.mock(
  "@/lib/client-ip",
  async () => await import("@/test/admin-action-mocks"),
);
vi.mock("@/lib/db", async () => ({
  db: {
    transaction: (await import("@/test/admin-action-mocks")).mockTransaction,
  },
}));
vi.mock("@/lib/entitlements/benefit-grants", () => ({
  revokeBenefitGrant: mockRevokeBenefitGrant,
}));
vi.mock(
  "@/lib/notifications/create-notification",
  async () => await import("@/test/admin-action-mocks"),
);
vi.mock(
  "../../../_lib/auth",
  async () => await import("@/test/admin-action-mocks"),
);
vi.mock("../../../users/_lib/moderation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../users/_lib/moderation")>()),
  recordModerationAction: (await import("@/test/admin-action-mocks"))
    .mockRecordModerationAction,
}));

import { revokeBenefitGrantAction } from "../revoke-benefit-grant";

const TX = { tag: "tx" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  setupAdminActor(TX);
  mockGetClientIp.mockResolvedValue(undefined);
  mockRevokeBenefitGrant.mockResolvedValue({
    id: "g1",
    userId: "u1",
    plan: "pro",
  });
});

describe("revokeBenefitGrantAction", () => {
  it("管理者でなければ unauthorized", async () => {
    mockRequireAdminActor.mockResolvedValue({ error: "unauthorized" });

    expect(await revokeBenefitGrantAction("g1", "理由")).toEqual({
      error: "unauthorized",
    });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("理由が空なら invalidReason", async () => {
    expect(await revokeBenefitGrantAction("g1", "")).toEqual({
      error: "invalidReason",
    });
  });

  it("取り消しと監査ログを同じトランザクションで書く（対象は付与先のユーザー）", async () => {
    expect(await revokeBenefitGrantAction("g1", " 誤付与 ")).toEqual({
      success: true,
    });
    expect(mockRevokeBenefitGrant).toHaveBeenCalledWith(TX, "g1", "誤付与");
    expect(mockRecordModerationAction).toHaveBeenCalledWith(TX, {
      actorId: "admin-1",
      action: "revoke_benefits",
      targetId: "u1",
      reason: "誤付与",
      ipAddress: undefined,
      metadata: { grantId: "g1", plan: "pro" },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/benefit-grants");
  });

  it("取り消せたら付与先に通知する", async () => {
    await revokeBenefitGrantAction("g1", "誤付与");

    expect(mockNotify).toHaveBeenCalledWith({
      userId: "u1",
      type: "benefit_grant_revoked",
      target: { type: "benefit_grant", id: "g1" },
      metadata: { plan: "pro" },
    });
  });

  it("該当の付与が無い（取消済み含む）なら notFound で監査ログも通知も書かない", async () => {
    mockRevokeBenefitGrant.mockResolvedValue(undefined);

    expect(await revokeBenefitGrantAction("g1", "理由")).toEqual({
      error: "notFound",
    });
    expect(mockRecordModerationAction).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
    expect(mockNotify).not.toHaveBeenCalled();
  });

  it("DB が失敗したら revokeFailed でログを残す", async () => {
    mockTransaction.mockRejectedValue(new Error("down"));

    expect(await revokeBenefitGrantAction("g1", "理由")).toEqual({
      error: "revokeFailed",
    });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[revokeBenefitGrant]"),
      "down",
    );
  });
});
