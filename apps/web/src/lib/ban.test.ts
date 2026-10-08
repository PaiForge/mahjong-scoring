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
    accountDeletions: { _name: "account_deletions", userId: "user_id" },
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
  /** プロフィールの読み込みと退会の要求の読み込みは、この順に呼ばれる */
  function given(profile: unknown[], deletion: unknown[]) {
    holder.chain.limit
      .mockResolvedValueOnce(profile)
      .mockResolvedValueOnce(deletion);
  }

  it("プロフィールが無く退会の要求も無ければ active（ユーザー名を決める前）", async () => {
    given([], []);
    expect(await getAccountStanding("new-user")).toBe("active");
  });

  it("プロフィールが無くても、退会の要求があれば deleting", async () => {
    given([], [{ userId: "new-user-2" }]);
    expect(await getAccountStanding("new-user-2")).toBe("deleting");
  });

  it("BAN 済みなら banned", async () => {
    given([{ bannedAt: new Date("2026-01-01"), deletedAt: null }], []);
    expect(await getAccountStanding("user-3")).toBe("banned");
  });

  it("BAN と退会の要求が重なったら deleting", async () => {
    given(
      [{ bannedAt: new Date("2026-01-01"), deletedAt: null }],
      [{ userId: "user-4" }],
    );
    expect(await getAccountStanding("user-4")).toBe("deleting");
  });

  it("要求の表より前に退会した（deletedAt だけがある）ユーザーも deleting", async () => {
    given([{ bannedAt: null, deletedAt: new Date("2026-01-02") }], []);
    expect(await getAccountStanding("user-5")).toBe("deleting");
  });
});
