import { describe, expect, it } from "vitest";

import {
  addPassDuration,
  isOfferKey,
  isPlanBenefit,
  isPlanKey,
  isPurchaseKind,
  PLAN_KEYS,
  PLAN_PAGE_HREF,
  PLANS,
  PurchaseKind,
} from "./plans";

const DAY_MS = 24 * 60 * 60 * 1000;

describe("isPurchaseKind", () => {
  it("売り方の種類の値をすべて認める", () => {
    for (const kind of Object.values(PurchaseKind)) {
      expect(isPurchaseKind(kind)).toBe(true);
    }
  });

  it("知らない種類は認めない", () => {
    expect(isPurchaseKind("subscription")).toBe(false);
    expect(isPurchaseKind("")).toBe(false);
  });
});

describe("PLAN_PAGE_HREF", () => {
  it("サイト内の絶対パスである", () => {
    expect(PLAN_PAGE_HREF.startsWith("/")).toBe(true);
  });
});

describe("PLANS と PLAN_KEYS", () => {
  it("プランのキーが 1 つ以上あり、どれもプランの定義を持つ", () => {
    expect(PLAN_KEYS.length).toBeGreaterThan(0);
    expect(Object.keys(PLANS).sort()).toEqual([...PLAN_KEYS].sort());
    for (const key of PLAN_KEYS) expect(PLANS[key].key).toBe(key);
  });

  it("isPlanKey は一覧のキーだけを認める", () => {
    for (const key of PLAN_KEYS) expect(isPlanKey(key)).toBe(true);
    expect(isPlanKey("free")).toBe(false);
    expect(isPlanKey("")).toBe(false);
  });

  it.each(PLAN_KEYS)(
    "%s は知っている特典を 1 つ以上、重複なく付ける",
    (key) => {
      const { benefits } = PLANS[key];
      expect(benefits.length).toBeGreaterThan(0);
      expect(new Set(benefits).size).toBe(benefits.length);
      for (const benefit of benefits) expect(isPlanBenefit(benefit)).toBe(true);
    },
  );

  it.each(PLAN_KEYS)(
    "%s の売り方はどれも売り方のキーで引け、パスは正の日数を持つ",
    (key) => {
      for (const [offerKey, offer] of Object.entries(PLANS[key].offers)) {
        expect(isOfferKey(offerKey)).toBe(true);
        expect(offer.key).toBe(offerKey);
        if (offer.kind === PurchaseKind.Pass) {
          expect(offer.durationDays).toBeGreaterThan(0);
        }
      }
    },
  );
});

describe("addPassDuration", () => {
  it("開始日時から日数ぶんの 24 時間を足した瞬間を返す", () => {
    const startsAt = new Date("2026-01-01T09:30:00.000Z");
    expect(addPassDuration(startsAt, 30).toISOString()).toBe(
      "2026-01-31T09:30:00.000Z",
    );
    expect(addPassDuration(startsAt, 1).getTime()).toBe(
      startsAt.getTime() + DAY_MS,
    );
  });

  it("開始日時を書き換えない", () => {
    const startsAt = new Date("2026-01-01T00:00:00.000Z");
    addPassDuration(startsAt, 30);
    expect(startsAt.toISOString()).toBe("2026-01-01T00:00:00.000Z");
  });
});
