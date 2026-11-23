import { describe, expect, it } from "vitest";

import { makeGrant, makePurchase } from "../purchase-rows.fixture";
import { viewerPlanOf } from "../viewer-plan";

const NOW = new Date("2026-10-01T03:00:00Z");
const PASS_UNTIL = new Date("2026-10-20T00:00:00Z");

describe("viewerPlanOf", () => {
  it("購入も付与も無ければ、売る・付与なし", () => {
    expect(viewerPlanOf([], [], NOW)).toEqual({
      purchaseBlock: { kind: "none" },
    });
  });

  it("有効なパスは期限を ISO 8601 にして返す", () => {
    expect(
      viewerPlanOf([makePurchase({ expiresAt: PASS_UNTIL })], [], NOW),
    ).toEqual({
      purchaseBlock: {
        kind: "until",
        until: "2026-10-20T00:00:00.000Z",
        inUse: true,
      },
    });
  });

  it("買い切りは期限なしで売らない", () => {
    expect(
      viewerPlanOf(
        [makePurchase({ kind: "lifetime", expiresAt: null })],
        [],
        NOW,
      ),
    ).toEqual({ purchaseBlock: { kind: "lifetime" } });
  });

  it("付与だけの人には売る。付与中であることと期限を添える", () => {
    expect(
      viewerPlanOf(
        [],
        [makeGrant({ expiresAt: new Date("2026-10-31T00:00:00Z") })],
        NOW,
      ),
    ).toEqual({
      purchaseBlock: { kind: "none" },
      granted: { until: "2026-10-31T00:00:00.000Z" },
    });
  });

  it("無期限の付与は期限を持たない", () => {
    expect(viewerPlanOf([], [makeGrant({ expiresAt: null })], NOW)).toEqual({
      purchaseBlock: { kind: "none" },
      granted: {},
    });
  });

  it("パスより後に切れる付与があっても、買えるようになるのはパスの期限", () => {
    expect(
      viewerPlanOf(
        [makePurchase({ expiresAt: PASS_UNTIL })],
        [makeGrant({ expiresAt: new Date("2026-10-31T00:00:00Z") })],
        NOW,
      ),
    ).toEqual({
      purchaseBlock: {
        kind: "until",
        until: "2026-10-20T00:00:00.000Z",
        inUse: true,
      },
      granted: { until: "2026-10-31T00:00:00.000Z" },
    });
  });
});
