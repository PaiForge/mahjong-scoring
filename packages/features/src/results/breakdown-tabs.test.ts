import { describe, expect, it } from "vitest";

import { resolveBreakdownTabs } from "./breakdown-tabs";

const both = { han: true, fu: true };

describe("resolveBreakdownTabs", () => {
  it("表示設定の符／翻の順に並べる", () => {
    expect(resolveBreakdownTabs("fu-first", both, undefined).kinds).toEqual([
      "fu",
      "han",
    ]);
    expect(resolveBreakdownTabs("han-first", both, undefined).kinds).toEqual([
      "han",
      "fu",
    ]);
  });

  it("内訳の無い種類は並べない", () => {
    expect(
      resolveBreakdownTabs("fu-first", { han: true, fu: false }, undefined),
    ).toEqual({ kinds: ["han"], initial: "han" });
    expect(
      resolveBreakdownTabs("fu-first", { han: false, fu: false }, undefined),
    ).toEqual({ kinds: [], initial: undefined });
  });

  it("片方だけ間違えたら、開いたときにその内訳を選ぶ", () => {
    expect(
      resolveBreakdownTabs("fu-first", both, {
        isHanCorrect: false,
        isFuCorrect: true,
      }).initial,
    ).toBe("han");
    expect(
      resolveBreakdownTabs("han-first", both, {
        isHanCorrect: true,
        isFuCorrect: false,
      }).initial,
    ).toBe("fu");
  });

  it("両方正解・両方不正解・無回答なら並びの先頭を選ぶ", () => {
    for (const judgement of [
      { isHanCorrect: true, isFuCorrect: true },
      { isHanCorrect: false, isFuCorrect: false },
      undefined,
    ]) {
      expect(resolveBreakdownTabs("han-first", both, judgement).initial).toBe(
        "han",
      );
    }
  });

  it("間違えた側の内訳が無ければ、ある方を選ぶ", () => {
    expect(
      resolveBreakdownTabs(
        "fu-first",
        { han: true, fu: false },
        { isHanCorrect: true, isFuCorrect: false },
      ).initial,
    ).toBe("han");
  });
});
