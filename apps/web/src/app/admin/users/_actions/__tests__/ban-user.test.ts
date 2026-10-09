import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  mockRecordModerationAction,
  mockRequireAdminActor,
  mockRevalidatePath,
  mockTransaction,
  setupAdminActor,
} from "@/test/admin-action-mocks";

const { mockUpdateSet, mockUpdateWhere, mockUpdateUserById } = vi.hoisted(
  () => ({
    mockUpdateSet: vi.fn(),
    mockUpdateWhere: vi.fn(),
    mockUpdateUserById: vi.fn(),
  }),
);

vi.mock("next/cache", async () => await import("@/test/admin-action-mocks"));
vi.mock(
  "@/lib/client-ip",
  async () => await import("@/test/admin-action-mocks"),
);
vi.mock("@/lib/db", async () => ({
  db: {
    transaction: (await import("@/test/admin-action-mocks")).mockTransaction,
  },
  profiles: { id: "profiles.id", bannedAt: "profiles.banned_at" },
}));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: { admin: { updateUserById: mockUpdateUserById } },
  }),
}));
vi.mock(
  "../../../_lib/auth",
  async () => await import("@/test/admin-action-mocks"),
);
vi.mock("../../_lib/moderation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../_lib/moderation")>()),
  recordModerationAction: (await import("@/test/admin-action-mocks"))
    .mockRecordModerationAction,
}));

import { banUser } from "../ban-user";

/** トランザクション内の `tx.update(profiles).set(...).where(...)` を受ける偽の tx */
const updateChain = { set: mockUpdateSet, where: mockUpdateWhere };
const TX = { update: vi.fn(() => updateChain) };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  setupAdminActor(TX);
  mockUpdateUserById.mockResolvedValue({ error: null });
  mockUpdateSet.mockReturnValue(updateChain);
  mockUpdateWhere.mockResolvedValue(undefined);
});

describe("banUser", () => {
  it("管理者でなければ unauthorized で Auth にも DB にも触らない", async () => {
    mockRequireAdminActor.mockResolvedValue({ error: "unauthorized" });

    expect(await banUser("u1", "理由")).toEqual({ error: "unauthorized" });
    expect(mockUpdateUserById).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("自分自身は BAN できない", async () => {
    expect(await banUser("admin-1", "理由")).toEqual({
      error: "cannotBanSelf",
    });
    expect(mockUpdateUserById).not.toHaveBeenCalled();
  });

  it("理由が空白だけなら invalidReason", async () => {
    expect(await banUser("u1", "   ")).toEqual({ error: "invalidReason" });
    expect(mockUpdateUserById).not.toHaveBeenCalled();
  });

  it("Auth の BAN が失敗したら banFailed で DB に触らない", async () => {
    mockUpdateUserById.mockResolvedValue({ error: { message: "boom" } });

    expect(await banUser("u1", "理由")).toEqual({ error: "banFailed" });
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("Auth を永久 BAN してから、bannedAt と監査ログを同じトランザクションで書く", async () => {
    const result = await banUser("u1", "  スパム ");

    expect(result).toEqual({ success: true });
    expect(mockUpdateUserById).toHaveBeenCalledTimes(1);
    expect(mockUpdateUserById).toHaveBeenCalledWith("u1", {
      ban_duration: "876000h",
    });
    // Auth → DB の順（Auth が失敗したら DB を汚さないため）
    expect(mockUpdateUserById.mock.invocationCallOrder[0]).toBeLessThan(
      mockTransaction.mock.invocationCallOrder[0] ?? 0,
    );
    expect(mockUpdateSet).toHaveBeenCalledWith({ bannedAt: expect.any(Date) });
    expect(mockRecordModerationAction).toHaveBeenCalledWith(TX, {
      actorId: "admin-1",
      action: "ban",
      targetId: "u1",
      reason: "スパム",
      ipAddress: "203.0.113.1",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/users", "layout");
  });

  it("仮登録（プロフィール無し）でも成功する — profiles の更新は 0 行で BAN は Auth にだけ残る", async () => {
    // 0 行更新は drizzle ではエラーにならない。既存の行が無くても同じ経路を通る
    mockUpdateWhere.mockResolvedValue(undefined);

    expect(await banUser("provisional-1", "理由")).toEqual({ success: true });
    expect(mockUpdateUserById).toHaveBeenCalledWith("provisional-1", {
      ban_duration: "876000h",
    });
    expect(mockRecordModerationAction).toHaveBeenCalledWith(
      TX,
      expect.objectContaining({ action: "ban", targetId: "provisional-1" }),
    );
  });

  it("DB が失敗したら Auth の BAN を解いて banFailed", async () => {
    mockTransaction.mockRejectedValue(new Error("db down"));

    expect(await banUser("u1", "理由")).toEqual({ error: "banFailed" });
    expect(mockUpdateUserById).toHaveBeenNthCalledWith(1, "u1", {
      ban_duration: "876000h",
    });
    expect(mockUpdateUserById).toHaveBeenNthCalledWith(2, "u1", {
      ban_duration: "none",
    });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("Auth のロールバックも失敗したら、食い違いを対象ユーザー付きでログに残す", async () => {
    mockTransaction.mockRejectedValue(new Error("db down"));
    mockUpdateUserById
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: "auth down" } });

    expect(await banUser("u1", "理由")).toEqual({ error: "banFailed" });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Auth and DB disagree for u1"),
      expect.anything(),
    );
  });
});
