import { describe, it, expect, vi, beforeEach } from "vitest";

import type { QueryChainMock } from "@/test/drizzle-mock";

// vi.mock の factory は巻き上げられるため、チェーンは hoisted な入れ物経由で受け取る
const holder = vi.hoisted(() => ({
  chain: undefined as unknown as QueryChainMock,
}));

vi.mock("./db", async () => {
  const { createQueryChain } = await import("@/test/drizzle-mock");
  const { profiles } = await import("@/test/schema-mock");
  holder.chain = createQueryChain();
  return {
    db: { select: vi.fn(() => holder.chain) },
    profiles,
  };
});

import { getAccountStanding, isUserBanned } from "./ban";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("isUserBanned", () => {
  it("returns false when no profile is found", async () => {
    holder.chain.limit.mockResolvedValue([]);
    expect(await isUserBanned("unknown-user")).toBe(false);
  });

  it("returns false when bannedAt is null", async () => {
    holder.chain.limit.mockResolvedValue([{ bannedAt: undefined }]);
    expect(await isUserBanned("user-1")).toBe(false);
  });

  it("returns true when bannedAt is a date", async () => {
    holder.chain.limit.mockResolvedValue([
      { bannedAt: new Date("2026-01-01") },
    ]);
    expect(await isUserBanned("user-2")).toBe(true);
  });
});

describe("getAccountStanding", () => {
  it("プロフィールが無ければ active（ユーザー名を決める前）", async () => {
    holder.chain.limit.mockResolvedValue([]);
    expect(await getAccountStanding("new-user")).toBe("active");
  });

  it("退会済みなら deleted", async () => {
    holder.chain.limit.mockResolvedValue([
      { bannedAt: null, deletedAt: new Date("2026-01-01") },
    ]);
    expect(await getAccountStanding("user-3")).toBe("deleted");
  });

  it("BAN と退会済みが重なったら banned", async () => {
    holder.chain.limit.mockResolvedValue([
      { bannedAt: new Date("2026-01-01"), deletedAt: new Date("2026-01-02") },
    ]);
    expect(await getAccountStanding("user-4")).toBe("banned");
  });
});
