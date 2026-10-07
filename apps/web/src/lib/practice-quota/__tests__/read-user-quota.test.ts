import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSelect } = vi.hoisted(() => ({ mockSelect: vi.fn() }));

vi.mock("@/lib/db", () => ({
  db: { select: mockSelect },
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

import { readUserQuotaUsage } from "../read-user-quota";

let chain: QueryChainMock;

function givenRows(rows: readonly { count: number }[]) {
  chain = createQueryChain(rows);
  mockSelect.mockReturnValue(chain);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("readUserQuotaUsage", () => {
  it("行があれば count を返し、何も書かない", async () => {
    givenRows([{ count: 2 }]);

    expect(await readUserQuotaUsage("u1", "score", "2026-10-01")).toBe(2);
    expect(chain.where).toHaveBeenCalledWith(
      expect.objectContaining({
        op: "and",
        args: [
          { op: "eq", args: ["user_id", "u1"] },
          { op: "eq", args: ["menu", "score"] },
          { op: "eq", args: ["day", "2026-10-01"] },
        ],
      }),
    );
  });

  it("行が無ければまだ 1 問も生成していないので 0", async () => {
    givenRows([]);
    expect(await readUserQuotaUsage("u1", "tenpai-score", "2026-10-01")).toBe(
      0,
    );
  });

  it("DB の失敗はそのまま投げる", async () => {
    mockSelect.mockImplementation(() => {
      throw new Error("boom");
    });
    await expect(
      readUserQuotaUsage("u1", "score", "2026-10-01"),
    ).rejects.toThrow("boom");
  });
});
