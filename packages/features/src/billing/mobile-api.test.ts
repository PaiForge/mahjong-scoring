import { describe, expect, it } from "vitest";

import {
  GOOGLE_MOCK_PURCHASE_TOKEN_PREFIX,
  isMobilePlanErrorCode,
  MOBILE_APPLE_TRANSACTIONS_API_PATH,
  MOBILE_GOOGLE_PURCHASES_API_PATH,
  MOBILE_PLAN_API_PATH,
  MOBILE_PLAN_ERROR_CODES,
  MOBILE_PLAN_OFFERS_API_PATH,
  MOBILE_PRACTICE_QUOTA_BEGIN_API_PATH,
  mobilePlanOffersApiUrl,
  mobilePracticeQuotaApiUrl,
  parseMobileAppleTransactionResponse,
  parseMobilePlanOffersResponse,
  parseMobilePlanResponse,
  parseMobilePracticeQuotaResponse,
  parseMobilePurchaseRecordResponse,
} from "./mobile-api";

const PLAN = {
  status: { kind: "pass", until: "2026-11-10T00:00:00.000Z" },
  benefits: ["unlimited_practice", "practice_tools"],
  canPurchase: false,
  offers: [{ key: "pass", productId: "help.mahjong.score.pro.pass30" }],
  purchases: [
    {
      provider: "apple",
      kind: "pass",
      createdAt: "2026-10-11T00:00:00.000Z",
      expiresAt: "2026-11-10T00:00:00.000Z",
      state: "active",
    },
  ],
};

describe("parseMobilePlanResponse", () => {
  it("知っている値はそのまま読む", () => {
    expect(parseMobilePlanResponse(PLAN)).toEqual(PLAN);
  });

  it("知らない決済元・種類・状態は行ごと落とさず無害な既定に倒す", () => {
    expect(
      parseMobilePlanResponse({
        ...PLAN,
        purchases: [
          {
            provider: "amazon",
            kind: "subscription",
            createdAt: "2026-10-11T00:00:00.000Z",
            state: "paused",
          },
        ],
      })?.purchases,
    ).toEqual([
      {
        provider: "stripe",
        kind: "pass",
        createdAt: "2026-10-11T00:00:00.000Z",
        state: "expired",
      },
    ]);
  });

  it("Google Play の購入は決済元 google のまま読む", () => {
    const purchase = {
      provider: "google",
      kind: "lifetime",
      createdAt: "2026-10-11T00:00:00.000Z",
      state: "active",
    };
    expect(
      parseMobilePlanResponse({ ...PLAN, purchases: [purchase] })?.purchases,
    ).toEqual([purchase]);
  });

  it("知らない特典・売り方は除き、知らない状態の種類は free にする", () => {
    const parsed = parseMobilePlanResponse({
      ...PLAN,
      status: { kind: "family" },
      benefits: ["unlimited_practice", "future_benefit"],
      offers: [{ key: "yearly", productId: "x" }],
    });
    expect(parsed?.status).toEqual({ kind: "free" });
    expect(parsed?.benefits).toEqual(["unlimited_practice"]);
    expect(parsed?.offers).toEqual([]);
  });

  it("期限の無い付与は until を持たない", () => {
    expect(
      parseMobilePlanResponse({ ...PLAN, status: { kind: "granted" } })?.status,
    ).toStrictEqual({ kind: "granted" });
  });

  it("期限のある付与は until を読む", () => {
    const status = { kind: "granted", until: "2026-12-01T00:00:00.000Z" };
    expect(parseMobilePlanResponse({ ...PLAN, status })?.status).toEqual(
      status,
    );
  });

  it("買い切りの状態を読む", () => {
    expect(
      parseMobilePlanResponse({ ...PLAN, status: { kind: "lifetime" } })
        ?.status,
    ).toEqual({ kind: "lifetime" });
  });

  it("期限の無いパスは free に倒す", () => {
    expect(
      parseMobilePlanResponse({ ...PLAN, status: { kind: "pass" } })?.status,
    ).toEqual({ kind: "free" });
  });

  it("期限の無い購入の行は expiresAt を持たない", () => {
    const purchase = {
      provider: "stripe",
      kind: "lifetime",
      createdAt: "2026-10-11T00:00:00.000Z",
      state: "active",
    };
    expect(
      parseMobilePlanResponse({ ...PLAN, purchases: [purchase] })?.purchases,
    ).toStrictEqual([purchase]);
  });

  it("形が違えば undefined", () => {
    expect(parseMobilePlanResponse({ status: { kind: "free" } })).toBe(
      undefined,
    );
  });
});

describe("parseMobilePurchaseRecordResponse", () => {
  it("記録の結果とプランの状態を読む", () => {
    expect(
      parseMobilePurchaseRecordResponse({ ...PLAN, outcome: "recorded" }),
    ).toEqual({ ...PLAN, outcome: "recorded" });
  });

  it("Apple のパスの旧名は同じ関数を指す", () => {
    expect(parseMobileAppleTransactionResponse).toBe(
      parseMobilePurchaseRecordResponse,
    );
  });
});

describe("parseMobileAppleTransactionResponse", () => {
  it("記録の結果とプランの状態を読む", () => {
    expect(
      parseMobileAppleTransactionResponse({ ...PLAN, outcome: "duplicate" }),
    ).toEqual({ ...PLAN, outcome: "duplicate" });
  });

  it("知らない結果なら undefined", () => {
    expect(
      parseMobileAppleTransactionResponse({ ...PLAN, outcome: "pending" }),
    ).toBe(undefined);
  });
});

describe("parseMobilePlanOffersResponse", () => {
  it("空の一覧を読む", () => {
    expect(parseMobilePlanOffersResponse({ offers: [] })).toEqual({
      offers: [],
    });
  });
});

describe("parseMobilePracticeQuotaResponse", () => {
  it("無制限と数の両方を読み、知らない特典を除く", () => {
    expect(
      parseMobilePracticeQuotaResponse({
        allowed: true,
        remaining: "unlimited",
        limit: 5,
        benefits: ["practice_tools", "future_benefit"],
      }),
    ).toEqual({
      allowed: true,
      remaining: "unlimited",
      limit: 5,
      benefits: ["practice_tools"],
    });
  });
});

describe("isMobilePlanErrorCode", () => {
  it("API 固有の理由だけを認める", () => {
    expect(isMobilePlanErrorCode("ownedByAnotherAccount")).toBe(true);
    expect(isMobilePlanErrorCode("unauthorized")).toBe(false);
  });

  it("ストアに届かない・支払いが保留中の理由を認める", () => {
    expect(isMobilePlanErrorCode("storeUnavailable")).toBe(true);
    expect(isMobilePlanErrorCode("purchasePending")).toBe(true);
  });

  it("一覧は空でなく、空文字も重複も含まない", () => {
    expect(MOBILE_PLAN_ERROR_CODES.length).toBeGreaterThan(0);
    for (const code of MOBILE_PLAN_ERROR_CODES) expect(code).not.toBe("");
    expect(new Set(MOBILE_PLAN_ERROR_CODES).size).toBe(
      MOBILE_PLAN_ERROR_CODES.length,
    );
  });

  it("一覧の理由をすべて認め、文字列でない値は認めない", () => {
    for (const code of MOBILE_PLAN_ERROR_CODES) {
      expect(isMobilePlanErrorCode(code)).toBe(true);
    }
    expect(isMobilePlanErrorCode("")).toBe(false);
    expect(isMobilePlanErrorCode(undefined)).toBe(false);
    expect(isMobilePlanErrorCode(0)).toBe(false);
  });
});

describe("プランのアプリ向け API のパス", () => {
  const paths = [
    MOBILE_PLAN_API_PATH,
    MOBILE_PLAN_OFFERS_API_PATH,
    MOBILE_APPLE_TRANSACTIONS_API_PATH,
    MOBILE_GOOGLE_PURCHASES_API_PATH,
    MOBILE_PRACTICE_QUOTA_BEGIN_API_PATH,
  ];

  // 配布済みのアプリは強制的に更新できないので、どのパスも版付きの接頭辞の下に置く
  it.each(paths)("%s は版付きの接頭辞 /api/mobile/v1/ の下にある", (path) => {
    expect(path.startsWith("/api/mobile/v1/")).toBe(true);
    expect(path.length).toBeGreaterThan("/api/mobile/v1/".length);
  });

  it("API ごとにパスが重ならない", () => {
    expect(new Set(paths).size).toBe(paths.length);
  });

  it("出題開始のパスは残数を読む API のパスの下にある", () => {
    const quotaPath = mobilePracticeQuotaApiUrl("agari-score").split("?")[0];
    expect(
      MOBILE_PRACTICE_QUOTA_BEGIN_API_PATH.startsWith(`${quotaPath}/`),
    ).toBe(true);
  });
});

describe("GOOGLE_MOCK_PURCHASE_TOKEN_PREFIX", () => {
  // 空の接頭辞はどのトークンにも一致し、本物の購入をモックとして扱ってしまう
  it("空でない", () => {
    expect(GOOGLE_MOCK_PURCHASE_TOKEN_PREFIX.length).toBeGreaterThan(0);
  });
});

describe("mobilePlanOffersApiUrl", () => {
  it("OS をクエリに載せる", () => {
    expect(mobilePlanOffersApiUrl("android")).toBe(
      "/api/mobile/v1/plan/offers?platform=android",
    );
    expect(mobilePlanOffersApiUrl("ios")).toBe(
      "/api/mobile/v1/plan/offers?platform=ios",
    );
  });
});

describe("mobilePracticeQuotaApiUrl", () => {
  it("練習名をクエリに載せる", () => {
    expect(mobilePracticeQuotaApiUrl("agari-score")).toBe(
      "/api/mobile/v1/practice-quota?menu=agari-score",
    );
  });
});
