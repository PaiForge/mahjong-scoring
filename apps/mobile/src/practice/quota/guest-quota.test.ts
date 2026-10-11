import { describe, expect, it } from "vitest";

import {
  consumeGuestQuota,
  guestQuotaForDay,
  parseGuestQuotaState,
  type GuestQuotaState,
} from "./guest-quota";

const DAY = "2026-10-11";

describe("guestQuotaForDay", () => {
  it("保存が無ければ 0 から", () => {
    expect(guestQuotaForDay(undefined, DAY)).toEqual({
      day: DAY,
      counts: { "agari-score": 0, "tenpai-score": 0 },
    });
  });

  it("同じ日なら保存した数をそのまま使う", () => {
    const state: GuestQuotaState = {
      day: DAY,
      counts: { "agari-score": 1, "tenpai-score": 0 },
    };
    expect(guestQuotaForDay(state, DAY)).toBe(state);
  });

  it("日が変わると 0 に戻る", () => {
    const state: GuestQuotaState = {
      day: "2026-10-10",
      counts: { "agari-score": 1, "tenpai-score": 1 },
    };
    expect(guestQuotaForDay(state, DAY).counts).toEqual({
      "agari-score": 0,
      "tenpai-score": 0,
    });
  });
});

describe("consumeGuestQuota", () => {
  const fresh = guestQuotaForDay(undefined, DAY);

  it("消費すると数が増え、残りはこの 1 問を含めない", () => {
    const { state, usage } = consumeGuestQuota(fresh, "agari-score", 2);
    expect(usage).toEqual({ allowed: true, remaining: 1 });
    expect(state.counts).toEqual({ "agari-score": 1, "tenpai-score": 0 });
  });

  it("上限に達していれば不許可で、数は変えない", () => {
    const first = consumeGuestQuota(fresh, "agari-score", 1);
    expect(first.usage).toEqual({ allowed: true, remaining: 0 });
    const second = consumeGuestQuota(first.state, "agari-score", 1);
    expect(second.usage).toEqual({ allowed: false, remaining: 0 });
    expect(second.state).toBe(first.state);
  });

  it("練習ごとに別に数える", () => {
    const { state } = consumeGuestQuota(fresh, "agari-score", 1);
    expect(consumeGuestQuota(state, "tenpai-score", 1).usage.allowed).toBe(
      true,
    );
  });
});

describe("parseGuestQuotaState", () => {
  it("保存した形を読む", () => {
    expect(
      parseGuestQuotaState({
        day: DAY,
        counts: { "agari-score": 1, "tenpai-score": 2 },
      }),
    ).toEqual({ day: DAY, counts: { "agari-score": 1, "tenpai-score": 2 } });
  });

  it("形が違えば undefined", () => {
    expect(parseGuestQuotaState(undefined)).toBeUndefined();
    expect(parseGuestQuotaState({ day: 1, counts: {} })).toBeUndefined();
    expect(parseGuestQuotaState({ day: DAY })).toBeUndefined();
  });

  it("壊れた数・無い練習は 0 にする", () => {
    expect(
      parseGuestQuotaState({ day: DAY, counts: { "agari-score": -1 } }),
    ).toEqual({ day: DAY, counts: { "agari-score": 0, "tenpai-score": 0 } });
  });
});
