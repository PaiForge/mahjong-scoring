import { beforeEach, describe, expect, it, vi } from "vitest";

const { mockSelect } = vi.hoisted(() => ({ mockSelect: vi.fn() }));

vi.mock("server-only", () => ({}));

// `cache()` はリクエスト境界の無いテストではメモ化しない素の関数にする
vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  cache: <T>(fn: T) => fn,
}));

vi.mock("@/lib/db", async () => {
  const schema = await import("@/test/schema-mock");
  return {
    db: { select: mockSelect },
    purchases: schema.purchases,
    benefitGrants: schema.benefitGrants,
  };
});

vi.mock("drizzle-orm", async () => await import("@/test/drizzle-orm-mock"));

import { PlanBenefit } from "@mahjong-scoring/features/billing/plans";
import { createQueryChain, type QueryChainMock } from "@/test/drizzle-mock";

import { getActiveBenefits, hasBenefit } from "../has-benefit";

const NOW = new Date("2026-10-01T12:00:00Z");
const USER_ID = "user-1";

interface BenefitRow {
  readonly benefits: readonly string[];
}

let purchaseChain: QueryChainMock;
let grantChain: QueryChainMock;

/** 1 回目の select が purchases、2 回目が benefit_grants */
function givenRows(
  purchaseRows: readonly BenefitRow[],
  grantRows: readonly BenefitRow[] = [],
) {
  purchaseChain = createQueryChain(purchaseRows);
  grantChain = createQueryChain(grantRows);
  mockSelect.mockReturnValueOnce(purchaseChain).mockReturnValueOnce(grantChain);
}

/** 有効性の条件（取消なし・開始済み・期限内か永久） */
const ACTIVE_CONDITION = {
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
};

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

  it("手動付与の行も購入と OR で読む（購入が無くても付与だけで特典が付く）", async () => {
    givenRows([], [{ benefits: ["unlimited_practice", "practice_tools"] }]);

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

  it("購入も付与も無ければ空集合", async () => {
    givenRows([]);
    expect((await getActiveBenefits(USER_ID, NOW)).size).toBe(0);
  });

  it("有効性の条件を purchases / benefit_grants の両方の where に全部載せる", async () => {
    givenRows([]);

    await getActiveBenefits(USER_ID, NOW);

    expect(purchaseChain.from).toHaveBeenCalledWith(
      expect.objectContaining({ _name: "purchases" }),
    );
    expect(purchaseChain.where).toHaveBeenCalledWith(ACTIVE_CONDITION);
    expect(grantChain.from).toHaveBeenCalledWith(
      expect.objectContaining({ _name: "benefit_grants" }),
    );
    expect(grantChain.where).toHaveBeenCalledWith(ACTIVE_CONDITION);
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

  it("付与の読み込みだけが失敗しても特典なしに倒れる（購入だけで判定しない）", async () => {
    purchaseChain = createQueryChain([{ benefits: ["unlimited_practice"] }]);
    const failing = createQueryChain();
    failing.where.mockRejectedValue(new Error("grants unavailable"));
    mockSelect.mockReturnValueOnce(purchaseChain).mockReturnValueOnce(failing);

    const benefits = await getActiveBenefits(USER_ID, NOW);

    expect(benefits.size).toBe(0);
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining("[getActiveBenefits]"),
      "grants unavailable",
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
