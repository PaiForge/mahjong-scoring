import { describe, expect, it } from "vitest";

import { isPurchaseState, PurchaseState } from "./purchase-state";

describe("PurchaseState", () => {
  // アプリ向け API の応答に載り、アプリと web が同じ語で読み分ける
  it("値は空でなく、重複しない", () => {
    const values = Object.values(PurchaseState);
    for (const value of values) expect(value).not.toBe("");
    expect(new Set(values).size).toBe(values.length);
  });
});

describe("isPurchaseState", () => {
  it("購入状態の値をすべて認める", () => {
    for (const state of Object.values(PurchaseState)) {
      expect(isPurchaseState(state)).toBe(true);
    }
  });

  it("知らない状態は認めない", () => {
    expect(isPurchaseState("paused")).toBe(false);
    expect(isPurchaseState("")).toBe(false);
  });
});
