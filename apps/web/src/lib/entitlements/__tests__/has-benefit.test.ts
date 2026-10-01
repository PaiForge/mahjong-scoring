import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSelect } = vi.hoisted(() => ({ mockSelect: vi.fn() }));

vi.mock("server-only", () => ({}));

// `cache()` はリクエスト境界の無いテストではメモ化しない素の関数にする
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  cache: <T>(fn: T) => fn,
}));

vi.mock("@/lib/db", async () => ({
  db: { select: mockSelect },
  purchases: (await import("@/test/schema-mock")).purchases,
}));

vi.mock("drizzle-orm", async () => await import("@/test/drizzle-orm-mock"));

import { PlanBenefit } from "@/lib/billing/plans";
import { createQueryChain, type QueryChainMock } from "@/test/drizzle-mock";

import { getActiveBenefits, hasBenefit } from "../has-benefit";

const NOW = new Date("2026-10-01T12:00:00Z");
const USER_ID = "user-1";

let chain: QueryChainMock;

function givenRows(rows: readonly { benefits: readonly string[] }[]) {
  chain = createQueryChain(rows);
  mockSelect.mockReturnValue(chain);
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(console, "error").mockImplementation(() => undefined);
});

describe("getActiveBenefits", () => {
  it("有効な購入行の benefits の和集合を返す", async () => {
    givenRows([
      { benefits: ["unlimited_practice"] },
      { benefits: ["unlimited_practice", "practice_tools"] },
    ]);

    const benefits = await getActiveBenefits(USER_ID, NOW);

    expect([...benefits].sort()).toEqual([
      "practice_tools",
      "unlimited_practice",
    ]);
  });

  it("コードに無い特典の文字列は無視する（消した特典が DB に残っていても判定に出ない）", async () => {
    givenRows([{ benefits: ["ad_free", "practice_tools"] }]);

    const benefits = await getActiveBenefits(USER_ID, NOW);

    expect([...benefits]).toEqual(["practice_tools"]);
  });

  it("購入が無ければ空集合", async () => {
    givenRows([]);
    expect((await getActiveBenefits(USER_ID, NOW)).size).toBe(0);
  });

  it("有効性の条件を where に全部載せる（取消なし・開始済み・期限内か永久）", async () => {
    givenRows([]);

    await getActiveBenefits(USER_ID, NOW);

    expect(chain.where).toHaveBeenCalledWith({
      op: "and",
      args: [
        { op: "eq", args: ["user_id", USER_ID] },
        { op: "isNull", args: ["revoked_at"] },
        { op: "lte", args: ["starts_at", NOW] },
        {
          op: "or",
          args: [
            { op: "isNull", args: ["expires_at"] },
            { op: "gt", args: ["expires_at", NOW] },
          ],
        },
      ],
    });
  });

  it("DB が失敗したら特典なし（fail-closed）でログを残す", async () => {
    mockSelect.mockImplementation(() => {
      throw new Error("connection refused");
    });

    const benefits = await getActiveBenefits(USER_ID, NOW);

    expect(benefits.size).toBe(0);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[getActiveBenefits]"),
      "connection refused",
    );
  });
});

describe("hasBenefit", () => {
  it("集合に含まれれば true", async () => {
    givenRows([{ benefits: ["practice_tools"] }]);
    expect(await hasBenefit(USER_ID, PlanBenefit.PracticeTools, NOW)).toBe(
      true,
    );
  });

  it("含まれなければ false", async () => {
    givenRows([{ benefits: ["practice_tools"] }]);
    expect(await hasBenefit(USER_ID, PlanBenefit.UnlimitedPractice, NOW)).toBe(
      false,
    );
  });
});
