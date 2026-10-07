import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockInsert } = vi.hoisted(() => ({ mockInsert: vi.fn() }));

vi.mock("@/lib/db", () => ({
  db: { insert: mockInsert },
  practiceQuotaUsage: {
    _name: "practice_quota_usage",
    userId: "user_id",
    menu: "menu",
    day: "day",
    count: "count",
  },
}));

vi.mock("drizzle-orm", async () => await import("@/test/drizzle-orm-mock"));

import { createQueryChain, type QueryChainMock } from "@/test/drizzle-mock";

import { consumeUserQuota } from "../consume-user-quota";

let chain: QueryChainMock;

function givenReturning(rows: readonly { count: number }[]) {
  chain = createQueryChain(rows);
  mockInsert.mockReturnValue(chain);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("consumeUserQuota", () => {
  it("上限が 0 以下なら DB に触らず不許可", async () => {
    expect(
      await consumeUserQuota("u1", "agari-score", "2026-10-01", 0),
    ).toEqual({
      allowed: false,
      remaining: 0,
    });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it("行が返れば許可し、残りは上限 − count", async () => {
    givenReturning([{ count: 2 }]);

    expect(
      await consumeUserQuota("u1", "agari-score", "2026-10-01", 5),
    ).toEqual({
      allowed: true,
      remaining: 3,
    });
  });

  it("行が返らなければ上限到達（UPDATE が WHERE で起きなかった）", async () => {
    givenReturning([]);

    expect(
      await consumeUserQuota("u1", "agari-score", "2026-10-01", 5),
    ).toEqual({
      allowed: false,
      remaining: 0,
    });
  });

  it("先に 1 を入れ、衝突時は count+1 を上限未満のときだけ行う単文の UPSERT", async () => {
    givenReturning([{ count: 1 }]);

    await consumeUserQuota("u1", "tenpai-score", "2026-10-01", 3);

    expect(chain.values).toHaveBeenCalledWith({
      userId: "u1",
      menu: "tenpai-score",
      day: "2026-10-01",
      count: 1,
    });
    expect(chain.onConflictDoUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        target: ["user_id", "menu", "day"],
        set: expect.objectContaining({ count: expect.anything() }),
        setWhere: expect.anything(),
      }),
    );
    expect(chain.returning).toHaveBeenCalledWith({ count: "count" });
  });

  it("残りは負にならない（count が上限ちょうどのとき 0）", async () => {
    givenReturning([{ count: 5 }]);
    expect(
      await consumeUserQuota("u1", "agari-score", "2026-10-01", 5),
    ).toEqual({
      allowed: true,
      remaining: 0,
    });
  });

  it("DB の失敗はそのまま投げる（許可するかは呼び出し側が決める）", async () => {
    mockInsert.mockImplementation(() => {
      throw new Error("boom");
    });
    await expect(
      consumeUserQuota("u1", "agari-score", "2026-10-01", 5),
    ).rejects.toThrow("boom");
  });
});
