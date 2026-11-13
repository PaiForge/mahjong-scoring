import { describe, expect, it } from "vitest";

import type { MobilePlanStatus } from "./mobile-api";
import { planBadgeOf } from "./plan-badge";

describe("planBadgeOf", () => {
  it("買い切りの購入は Pro のラベル", () => {
    expect(planBadgeOf({ kind: "lifetime" })).toBe("pro");
  });

  it("30 日パスの購入は Pro のラベル", () => {
    expect(planBadgeOf({ kind: "pass" })).toBe("pro");
  });

  it("運営からの付与は期限の有無によらず VIP のラベル", () => {
    expect(planBadgeOf({ kind: "granted" })).toBe("vip");
  });

  it("無料はラベルを出さない", () => {
    expect(planBadgeOf({ kind: "free" })).toBeUndefined();
  });

  it("購入と付与が重なる人は、プラン状況が選んだ 1 つの kind に従いラベルも 1 つ", () => {
    // planStatusOf が買い切りを最優先にした結果は lifetime 1 つで、VIP は出ない
    expect(planBadgeOf({ kind: "lifetime" })).toBe("pro");
  });

  it("アプリ向け API のプラン状況（期限が文字列）もそのまま渡せる", () => {
    const status: MobilePlanStatus = {
      kind: "granted",
      until: "2026-12-01T00:00:00.000Z",
    };
    expect(planBadgeOf(status)).toBe("vip");
  });

  it("web のプラン状況（期限が Date）もそのまま渡せる", () => {
    expect(
      planBadgeOf({ kind: "pass", until: new Date("2026-12-01T00:00:00Z") }),
    ).toBe("pro");
  });
});
