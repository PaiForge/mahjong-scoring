import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  authDelete: vi.fn(),
  transaction: vi.fn(),
  remove: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
}));
vi.mock("server-only", () => ({}));
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
it("Auth 削除が失敗した場合にデータを先に消さない", async () => {
  mocks.authDelete.mockResolvedValue({ error: new Error("auth failed") });
  expect(await deleteAccount("user")).toEqual({ error: "deleteFailed" });
  expect(mocks.transaction).not.toHaveBeenCalled();
});
it("DB 削除の失敗を完了扱いにしない", async () => {
  mocks.transaction.mockRejectedValue(new Error("db failed"));
  await expect(deleteAccount("user")).rejects.toThrow("db failed");
});
