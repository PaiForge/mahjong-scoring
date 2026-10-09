import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  mockNotify,
  mockRecordModerationAction,
  mockRequireAdminActor,
  mockRevalidatePath,
  mockTransaction,
  setupAdminActor,
} from "@/test/admin-action-mocks";

const { mockInsertBenefitGrant } = vi.hoisted(() => ({
  mockInsertBenefitGrant: vi.fn(),
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
  insertBenefitGrant: mockInsertBenefitGrant,
}));
vi.mock(
  "@/lib/notifications/create-notification",
  async () => await import("@/test/admin-action-mocks"),
);
vi.mock(
  "../../../_lib/auth",
  async () => await import("@/test/admin-action-mocks"),
);
vi.mock("../../_lib/moderation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../_lib/moderation")>()),
  recordModerationAction: (await import("@/test/admin-action-mocks"))
    .mockRecordModerationAction,
}));

import { grantBenefits } from "../grant-benefits";

const TX = { tag: "tx" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  setupAdminActor(TX);
  mockInsertBenefitGrant.mockResolvedValue({
    id: "g1",
    plan: "pro",
    benefits: ["unlimited_practice", "practice_tools"],
    expiresAt: new Date("2026-10-31T00:00:00Z"),
  });
});

describe("grantBenefits", () => {
  it("管理者でなければ unauthorized で何も書かない", async () => {
    mockRequireAdminActor.mockResolvedValue({ error: "unauthorized" });

    expect(await grantBenefits("u1", "days30", "理由")).toEqual({
      error: "unauthorized",
    });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("列挙に無い期間は invalidDuration", async () => {
    expect(await grantBenefits("u1", "days7", "理由")).toEqual({
      error: "invalidDuration",
    });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("理由が空白だけなら invalidReason", async () => {
    expect(await grantBenefits("u1", "days30", "   ")).toEqual({
      error: "invalidReason",
    });
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("付与行と監査ログを同じトランザクションで書き、一覧を再検証する", async () => {
    const result = await grantBenefits("u1", "days30", "  モニター ");

    expect(result).toEqual({ success: true });
    expect(mockInsertBenefitGrant).toHaveBeenCalledWith(TX, {
      userId: "u1",
      plan: "pro",
      reason: "モニター",
      grantedBy: "admin-1",
      durationDays: 30,
    });
    expect(mockRecordModerationAction).toHaveBeenCalledWith(TX, {
      actorId: "admin-1",
      action: "grant_benefits",
      targetId: "u1",
      reason: "モニター",
      ipAddress: "203.0.113.1",
      metadata: {
        grantId: "g1",
        plan: "pro",
        benefits: ["unlimited_practice", "practice_tools"],
        expiresAt: "2026-10-31T00:00:00.000Z",
      },
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/benefit-grants");
  });

  it("付与できたら付与先に通知する（期限は付与行と同じ）", async () => {
    await grantBenefits("u1", "days30", "モニター");

    expect(mockNotify).toHaveBeenCalledWith({
      userId: "u1",
      type: "benefit_granted",
      target: { type: "benefit_grant", id: "g1" },
      metadata: { plan: "pro", expiresAt: "2026-10-31T00:00:00.000Z" },
    });
  });

  it("無期限は durationDays undefined で、監査ログの expiresAt は null", async () => {
    mockInsertBenefitGrant.mockResolvedValue({
      id: "g1",
      plan: "pro",
      benefits: ["unlimited_practice"],
      expiresAt: null,
    });

    await grantBenefits("u1", "permanent", "補償");

    expect(mockInsertBenefitGrant).toHaveBeenCalledWith(
      TX,
      expect.objectContaining({ durationDays: undefined }),
    );
    expect(mockRecordModerationAction).toHaveBeenCalledWith(
      TX,
      expect.objectContaining({
        metadata: expect.objectContaining({ expiresAt: null }),
      }),
    );
  });

  it("DB が失敗したら grantFailed でログを残す", async () => {
    mockTransaction.mockRejectedValue(new Error("fk violation"));

    expect(await grantBenefits("u1", "days30", "理由")).toEqual({
      error: "grantFailed",
    });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[grantBenefits]"),
      "fk violation",
    );
    expect(mockRevalidatePath).not.toHaveBeenCalled();
    expect(mockNotify).not.toHaveBeenCalled();
  });
});
