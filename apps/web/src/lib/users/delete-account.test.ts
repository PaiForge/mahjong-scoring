import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  authDelete: vi.fn(),
  transaction: vi.fn(),
  remove: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    auth: { admin: { deleteUser: mocks.authDelete } },
    storage: { from: () => ({ list: async () => ({ data: [] }) }) },
  }),
}));
vi.mock("@/lib/db", async () => ({
  ...(await import("../db/schema")),
  db: { transaction: mocks.transaction },
}));
import { deleteAccount } from "./delete-account";
import {
  benefitGrants,
  challengeAttempts,
  notifications,
  practiceQuotaUsage,
  purchases,
  stripeCustomers,
} from "../db/schema";
import { createQueryChain } from "@/test/drizzle-mock";
beforeEach(() => {
  vi.clearAllMocks();
  mocks.authDelete.mockResolvedValue({ error: null });
  mocks.select.mockReturnValue(createQueryChain([]));
  mocks.remove.mockReturnValue(createQueryChain([]));
  mocks.update.mockReturnValue(createQueryChain([]));
  mocks.transaction.mockImplementation(async (run) =>
    run({ select: mocks.select, delete: mocks.remove, update: mocks.update }),
  );
});
it("Auth をソフト削除しても購入・顧客・付与・消費を明示的に削除する", async () => {
  expect(await deleteAccount("11111111-1111-4111-8111-111111111111")).toEqual({
    success: true,
  });
  expect(mocks.authDelete).toHaveBeenCalledWith(
    "11111111-1111-4111-8111-111111111111",
    true,
  );
  expect(mocks.transaction).toHaveBeenCalledTimes(1);
  for (const table of [
    purchases,
    stripeCustomers,
    benefitGrants,
    practiceQuotaUsage,
  ])
    expect(mocks.remove).toHaveBeenCalledWith(table);
  expect(mocks.remove.mock.calls[0][0]).toBe(stripeCustomers);
});
it("途中の挑戦と通知も消す（Auth のソフト削除では CASCADE しない）", async () => {
  await deleteAccount("user");
  expect(mocks.remove).toHaveBeenCalledWith(challengeAttempts);
  expect(mocks.remove).toHaveBeenCalledWith(notifications);
});
/**
 * Auth を最後に消すので、Auth の削除が失敗しても本人はまだログインでき、
 * もう一度退会すればやり直せる。
 */
it("DB を消してから Auth を消し、Auth の失敗は失敗として返す", async () => {
  const order: string[] = [];
  mocks.transaction.mockImplementation(async (run) => {
    order.push("db");
    return run({
      select: mocks.select,
      delete: mocks.remove,
      update: mocks.update,
    });
  });
  mocks.authDelete.mockImplementation(async () => {
    order.push("auth");
    return { error: new Error("auth failed") };
  });
  expect(await deleteAccount("user")).toEqual({ error: "deleteFailed" });
  expect(order).toEqual(["db", "auth"]);
});
it("DB 削除が失敗したら Auth を消さない（ログインを残して再試行させる）", async () => {
  mocks.transaction.mockRejectedValue(new Error("db failed"));
  await expect(deleteAccount("user")).rejects.toThrow("db failed");
  expect(mocks.authDelete).not.toHaveBeenCalled();
});
