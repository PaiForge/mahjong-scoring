import { describe, expect, it } from "vitest";

import {
  isMobilePlanErrorCode,
  mobilePracticeQuotaApiUrl,
  parseMobileAppleTransactionResponse,
  parseMobilePlanOffersResponse,
  parseMobilePlanResponse,
  parseMobilePracticeQuotaResponse,
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
            provider: "google",
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
    ).toEqual({ kind: "granted" });
  });

  it("形が違えば undefined", () => {
    expect(parseMobilePlanResponse({ status: { kind: "free" } })).toBe(
      undefined,
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
});

describe("mobilePracticeQuotaApiUrl", () => {
  it("練習名をクエリに載せる", () => {
    expect(mobilePracticeQuotaApiUrl("agari-score")).toBe(
      "/api/mobile/v1/practice-quota?menu=agari-score",
    );
  });
});
