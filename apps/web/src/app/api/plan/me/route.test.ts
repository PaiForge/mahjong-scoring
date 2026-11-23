// @vitest-environment node
/**
 * 自分のプラン状態取得 API のテスト
 *
 * @description
 * - 未ログインは `plan: null` の 200（購入履歴を読まない）
 * - ログイン済みは購入と付与から導いた状態を返す
 * - 読み取りの失敗は 500（「購入なし」に倒さない）
 * - どの応答も共有キャッシュに乗せない
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getOptionalUser: vi.fn(),
  listPurchases: vi.fn(),
  listBenefitGrants: vi.fn(),
  logExternalError: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ getOptionalUser: mocks.getOptionalUser }));
vi.mock("@/lib/billing/purchases", () => ({
  listPurchases: mocks.listPurchases,
}));
vi.mock("@/lib/entitlements/benefit-grants", () => ({
  listBenefitGrants: mocks.listBenefitGrants,
}));
vi.mock("@/lib/log-error", () => ({
  logExternalError: mocks.logExternalError,
}));

import { makePurchase } from "@/lib/billing/purchase-rows.fixture";

import { GET } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getOptionalUser.mockResolvedValue({ id: "u" });
  mocks.listPurchases.mockResolvedValue([]);
  mocks.listBenefitGrants.mockResolvedValue([]);
});

describe("GET /api/plan/me", () => {
  it("未ログインは plan: null を返し、購入履歴を読まない", async () => {
    mocks.getOptionalUser.mockResolvedValue(undefined);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ plan: null });
    expect(mocks.listPurchases).not.toHaveBeenCalled();
  });

  it("購入も付与も無いログイン済みには「売る」を返す", async () => {
    const response = await GET();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      plan: { purchaseBlock: { kind: "none" } },
    });
    expect(mocks.listPurchases).toHaveBeenCalledWith("u");
    expect(mocks.listBenefitGrants).toHaveBeenCalledWith("u");
  });

  it("有効な買い切りがあれば「売らない」を返す", async () => {
    mocks.listPurchases.mockResolvedValue([
      makePurchase({ kind: "lifetime", expiresAt: null }),
    ]);
    const response = await GET();
    expect(await response.json()).toEqual({
      plan: { purchaseBlock: { kind: "lifetime" } },
    });
  });

  it("購入履歴を読めなければ 500 を返す（購入なしに倒さない）", async () => {
    mocks.listPurchases.mockRejectedValue(new Error("db down"));
    const response = await GET();
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({ error: "unknown" });
    expect(mocks.logExternalError).toHaveBeenCalled();
  });

  it("どの応答も共有キャッシュに乗せない", async () => {
    expect((await GET()).headers.get("Cache-Control")).toBe(
      "private, no-store",
    );
    mocks.getOptionalUser.mockResolvedValue(undefined);
    expect((await GET()).headers.get("Cache-Control")).toBe(
      "private, no-store",
    );
  });
});
