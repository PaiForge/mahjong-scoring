import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  mockRecordModerationAction,
  mockRequireAdminActor,
  mockRevalidatePath,
  mockRevalidateTag,
  mockTransaction,
  setupAdminActor,
} from "@/test/admin-action-mocks";

const {
  mockSelectLimit,
  mockDbUpdateSet,
  mockDbUpdateWhere,
  mockTxUpdateSet,
  mockTxUpdateWhere,
  mockUpdateUserById,
} = vi.hoisted(() => ({
  mockSelectLimit: vi.fn(),
  mockDbUpdateSet: vi.fn(),
  mockDbUpdateWhere: vi.fn(),
  mockTxUpdateSet: vi.fn(),
  mockTxUpdateWhere: vi.fn(),
  mockUpdateUserById: vi.fn(),
}));

vi.mock("next/cache", async () => await import("@/test/admin-action-mocks"));
vi.mock(
  "@/lib/client-ip",
  async () => await import("@/test/admin-action-mocks"),
);
vi.mock("@/lib/db", async () => {
  // `db.select(...).from(...).where(...).limit(1)` — 元の bannedAt の退避
  const selectChain = {
    from: () => selectChain,
    where: () => selectChain,
    limit: mockSelectLimit,
  };
  // `db.update(profiles).set(...).where(...)` — ロールバック時の bannedAt 復元
  const dbUpdateChain = { set: mockDbUpdateSet, where: mockDbUpdateWhere };
  return {
    db: {
      transaction: (await import("@/test/admin-action-mocks")).mockTransaction,
      select: () => selectChain,
      update: () => dbUpdateChain,
    },
    profiles: { id: "profiles.id", bannedAt: "profiles.banned_at" },
  };
});
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

import { unbanUser } from "../unban-user";

const bannedAt = new Date("2026-01-01T00:00:00+09:00");

/** トランザクション内の `tx.update(profiles).set(...).where(...)` を受ける偽の tx */
const txUpdateChain = { set: mockTxUpdateSet, where: mockTxUpdateWhere };
const TX = { update: vi.fn(() => txUpdateChain) };

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
  setupAdminActor(TX);
  mockUpdateUserById.mockResolvedValue({ error: null });
  mockSelectLimit.mockResolvedValue([{ bannedAt }]);
  mockDbUpdateSet.mockReturnValue({ where: mockDbUpdateWhere });
  mockDbUpdateWhere.mockResolvedValue(undefined);
  mockTxUpdateSet.mockReturnValue(txUpdateChain);
  mockTxUpdateWhere.mockResolvedValue(undefined);
});

describe("unbanUser", () => {
  it("管理者でなければ unauthorized で Auth にも DB にも触らない", async () => {
    mockRequireAdminActor.mockResolvedValue({ error: "unauthorized" });

    expect(await unbanUser("u1")).toEqual({ error: "unauthorized" });
    expect(mockUpdateUserById).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("Auth の解除が失敗したら unbanFailed で DB に触らない", async () => {
    mockUpdateUserById.mockResolvedValue({ error: { message: "boom" } });

    expect(await unbanUser("u1")).toEqual({ error: "unbanFailed" });
    expect(mockTransaction).not.toHaveBeenCalled();
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("Auth の BAN を解いてから、bannedAt を消し監査ログを同じトランザクションで書く", async () => {
    expect(await unbanUser("u1")).toEqual({ success: true });

    expect(mockUpdateUserById).toHaveBeenCalledTimes(1);
    expect(mockUpdateUserById).toHaveBeenCalledWith("u1", {
      ban_duration: "none",
    });
    expect(mockUpdateUserById.mock.invocationCallOrder[0]).toBeLessThan(
      mockTransaction.mock.invocationCallOrder[0] ?? 0,
    );
    expect(mockTxUpdateSet).toHaveBeenCalledTimes(1);
    expect(mockRecordModerationAction).toHaveBeenCalledWith(TX, {
      actorId: "admin-1",
      action: "unban",
      targetId: "u1",
      ipAddress: "203.0.113.1",
    });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/admin/users", "layout");
    // ランキングに載るかどうかが変わるので、ランキングのキャッシュも捨てる
    expect(mockRevalidateTag).toHaveBeenCalledWith("leaderboard", "default");
  });

  it("仮登録（プロフィール無し）の BAN も解除できる — Auth にしか残っていない BAN を解く経路", async () => {
    mockSelectLimit.mockResolvedValue([]);

    expect(await unbanUser("provisional-1")).toEqual({ success: true });
    expect(mockUpdateUserById).toHaveBeenCalledWith("provisional-1", {
      ban_duration: "none",
    });
    expect(mockRecordModerationAction).toHaveBeenCalledWith(
      TX,
      expect.objectContaining({ action: "unban", targetId: "provisional-1" }),
    );
  });

  it("DB が失敗したら Auth を再 BAN し、退避した bannedAt を戻して unbanFailed", async () => {
    mockTransaction.mockRejectedValue(new Error("db down"));

    expect(await unbanUser("u1")).toEqual({ error: "unbanFailed" });
    expect(mockUpdateUserById).toHaveBeenNthCalledWith(1, "u1", {
      ban_duration: "none",
    });
    expect(mockUpdateUserById).toHaveBeenNthCalledWith(2, "u1", {
      ban_duration: "876000h",
    });
    expect(mockDbUpdateSet).toHaveBeenCalledWith({ bannedAt });
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("DB が失敗しても退避した bannedAt が無ければ復元の UPDATE を発行しない（仮登録）", async () => {
    mockSelectLimit.mockResolvedValue([]);
    mockTransaction.mockRejectedValue(new Error("db down"));

    expect(await unbanUser("provisional-1")).toEqual({ error: "unbanFailed" });
    expect(mockUpdateUserById).toHaveBeenNthCalledWith(2, "provisional-1", {
      ban_duration: "876000h",
    });
    expect(mockDbUpdateSet).not.toHaveBeenCalled();
  });

  it("Auth の再 BAN も失敗したら、食い違いを対象ユーザー付きでログに残す", async () => {
    mockTransaction.mockRejectedValue(new Error("db down"));
    mockUpdateUserById
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: { message: "auth down" } });

    expect(await unbanUser("u1")).toEqual({ error: "unbanFailed" });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("Auth and DB disagree for u1"),
      expect.anything(),
    );
  });

  it("bannedAt の復元が失敗しても投げずに unbanFailed を返し、ログに残す", async () => {
    mockTransaction.mockRejectedValue(new Error("db down"));
    mockDbUpdateWhere.mockRejectedValue(new Error("still down"));

    expect(await unbanUser("u1")).toEqual({ error: "unbanFailed" });
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("failed to restore bannedAt for u1"),
      expect.anything(),
    );
  });
});
