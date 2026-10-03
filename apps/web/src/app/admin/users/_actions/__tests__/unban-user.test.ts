import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  mockRequireAdminActor,
  mockGetClientIp,
  mockTransaction,
  mockSelectLimit,
  mockDbUpdateSet,
  mockDbUpdateWhere,
  mockTxUpdateSet,
  mockTxUpdateWhere,
  mockUpdateUserById,
  mockRecordModerationAction,
  mockRevalidatePath,
} = vi.hoisted(() => ({
  mockRequireAdminActor: vi.fn(),
  mockGetClientIp: vi.fn(),
  mockTransaction: vi.fn(),
  mockSelectLimit: vi.fn(),
  mockDbUpdateSet: vi.fn(),
  mockDbUpdateWhere: vi.fn(),
  mockTxUpdateSet: vi.fn(),
  mockTxUpdateWhere: vi.fn(),
  mockUpdateUserById: vi.fn(),
  mockRecordModerationAction: vi.fn(),
  mockRevalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mockRevalidatePath }));
vi.mock("@/lib/client-ip", () => ({ getClientIp: mockGetClientIp }));
vi.mock("@/lib/db", () => {
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
      transaction: mockTransaction,
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
vi.mock("../../../_lib/auth", () => ({
  requireAdminActor: mockRequireAdminActor,
}));
vi.mock("../../_lib/moderation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../_lib/moderation")>()),
  recordModerationAction: mockRecordModerationAction,
}));

import { unbanUser } from "../unban-user";

const bannedAt = new Date("2026-01-01T00:00:00+09:00");

/** トランザクション内の `tx.update(profiles).set(...).where(...)` を受ける偽の tx */
const txUpdateChain = { set: mockTxUpdateSet, where: mockTxUpdateWhere };
const TX = { update: vi.fn(() => txUpdateChain) };

beforeEach(() => {
  vi.clearAllMocks();
  mockRequireAdminActor.mockResolvedValue({ actorId: "admin-1" });
  mockGetClientIp.mockResolvedValue("203.0.113.1");
  mockUpdateUserById.mockResolvedValue({ error: null });
  mockSelectLimit.mockResolvedValue([{ bannedAt }]);
  mockDbUpdateSet.mockReturnValue({ where: mockDbUpdateWhere });
  mockDbUpdateWhere.mockResolvedValue(undefined);
  mockTxUpdateSet.mockReturnValue(txUpdateChain);
  mockTxUpdateWhere.mockResolvedValue(undefined);
  mockTransaction.mockImplementation(
    async (fn: (tx: unknown) => Promise<void>) => fn(TX),
  );
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
});
