import { describe, expect, it } from "vitest";
import type { MobileAppleTransactionResponse } from "@mahjong-scoring/features/billing/mobile-api";

import type { PlanApiFailure, PlanApiResult } from "./plan-api";
import { shouldFinishAfter, summarizeRestore } from "./purchase-sync";

function ok(
  outcome: MobileAppleTransactionResponse["outcome"],
): PlanApiResult<MobileAppleTransactionResponse> {
  return {
    value: {
      outcome,
      status: { kind: "lifetime" },
      benefits: [],
      canPurchase: false,
      offers: [],
      purchases: [],
    },
  };
}

function failed(
  error: PlanApiFailure,
): PlanApiResult<MobileAppleTransactionResponse> {
  return { error };
}

describe("shouldFinishAfter", () => {
  it("記録した・記録済みなら完了する", () => {
    expect(shouldFinishAfter(ok("recorded"))).toBe(true);
    expect(shouldFinishAfter(ok("duplicate"))).toBe(true);
  });

  it("送り直しても通らない 4xx は完了する", () => {
    for (const error of [
      "usernameRequired",
      "ownedByAnotherAccount",
      "invalidTransaction",
      "unknownProduct",
      "sandboxNotAccepted",
    ] as const) {
      expect(shouldFinishAfter(failed(error))).toBe(true);
    }
  });

  it("サーバーが検証できない・通信や一時的な障害・ログインの問題は完了しない", () => {
    for (const error of [
      "appleUnavailable",
      "network",
      "serverError",
      "unauthorized",
      "userChanged",
      "authUnavailable",
      "rateLimited",
      "deleted",
      "unknown",
    ] as const) {
      expect(shouldFinishAfter(failed(error))).toBe(false);
    }
  });
});

describe("summarizeRestore", () => {
  it("端末に購入が無ければ復元するものは無い", () => {
    expect(summarizeRestore([])).toBe("nothingToRestore");
  });

  it("すべて記録済みなら復元するものは無い", () => {
    expect(summarizeRestore([ok("duplicate"), ok("duplicate")])).toBe(
      "nothingToRestore",
    );
  });

  it("1 件でも新しく記録できたら復元した", () => {
    expect(summarizeRestore([ok("duplicate"), ok("recorded")])).toBe(
      "restored",
    );
  });

  it("別のアカウントの取引があれば、記録できたものがあってもそれを知らせる", () => {
    expect(
      summarizeRestore([ok("recorded"), failed("ownedByAnotherAccount")]),
    ).toBe("ownedByAnotherAccount");
  });

  it("送れなかった取引があり新しい記録が無ければ失敗", () => {
    expect(summarizeRestore([ok("duplicate"), failed("network")])).toBe(
      "failed",
    );
    expect(summarizeRestore([failed("appleUnavailable")])).toBe("failed");
  });

  it("送り直しても通らない 4xx だけなら復元するものは無い", () => {
    expect(summarizeRestore([failed("sandboxNotAccepted")])).toBe(
      "nothingToRestore",
    );
  });
});
