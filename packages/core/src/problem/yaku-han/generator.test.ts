import { describe, it, expect } from "vitest";
import { generateYakuHanQuestion } from "./generator";
import { expectSampled } from "../../test/sampling";
import { mulberry32 } from "../../core/random";
import type { YakuHanQuestion } from "./types";
import {
  YAKU_HAN_ENTRIES,
  YAKUMAN_HAN,
  canPromptNaki,
  DEFAULT_YAKU_HAN_RANGE,
  getYakuHanEntries,
  normalizeYakuHanRange,
} from "./constants";

describe("generateYakuHanQuestion", () => {
  const byName = new Map(YAKU_HAN_ENTRIES.map((e) => [e.name, e]));

  it("生成した問題は YAKU_HAN_ENTRIES に存在する役である", () => {
    for (let i = 0; i < 200; i++) {
      const q = generateYakuHanQuestion();
      expect(byName.has(q.yakuName)).toBe(true);
    }
  });

  it("正解翻数は門前/鳴きの状態に対応した値である", () => {
    for (let i = 0; i < 500; i++) {
      const q = generateYakuHanQuestion();
      const entry = byName.get(q.yakuName);
      expect(entry).toBeDefined();
      if (!entry) continue;

      if (q.isMenzen) {
        expect(q.correctHan).toBe(entry.menzenHan);
      } else {
        // 鳴き状態が出るのは鳴き出題を許した役のみ
        expect(canPromptNaki(entry)).toBe(true);
        expect(q.correctHan).toBe(entry.nakiHan);
      }
    }
  });

  it("出題範囲を指定すると、その範囲の役のみ出題される", () => {
    const kuisagariNames = new Set(
      getYakuHanEntries("kuisagari").map((e) => e.name),
    );
    for (let i = 0; i < 300; i++) {
      const q = generateYakuHanQuestion("kuisagari");
      expect(kuisagariNames.has(q.yakuName)).toBe(true);
    }
  });

  it("鳴き状態で出題しない役は常に門前で出題される", () => {
    const menzenOnlyNames = new Set(
      YAKU_HAN_ENTRIES.filter((e) => !canPromptNaki(e)).map((e) => e.name),
    );
    // 対象の役が1問も出ないと無言で pass するため、母集団を保証する
    const questions = expectSampled(generateYakuHanQuestion, {
      need: 20,
      attempts: 500,
      where: (q) => menzenOnlyNames.has(q.yakuName),
    });

    for (const q of questions) {
      expect(q.isMenzen).toBe(true);
    }
  });

  it("三暗刻は鳴き状態で出題されない", () => {
    const questions = expectSampled(generateYakuHanQuestion, {
      need: 20,
      attempts: 1000,
      where: (q) => q.yakuName === "三暗刻",
    });

    for (const q of questions) {
      expect(q.isMenzen).toBe(true);
      expect(q.correctHan).toBe(2);
    }
  });
});

describe("generateYakuHanQuestion の出題履歴", () => {
  const key = (q: YakuHanQuestion) => `${q.yakuName}/${q.isMenzen}`;

  /** 履歴を渡しながら count 問続けて出題する */
  function play(count: number, seed: number, range = DEFAULT_YAKU_HAN_RANGE) {
    const rng = mulberry32(seed);
    const asked: YakuHanQuestion[] = [];
    for (let i = 0; i < count; i++) {
      asked.push(generateYakuHanQuestion(range, asked, rng));
    }
    return asked;
  }

  /** 出題範囲の問題（役 × 門前 / 鳴き）の数 */
  function poolSize(range = DEFAULT_YAKU_HAN_RANGE) {
    return getYakuHanEntries(range).reduce(
      (sum, e) => sum + (canPromptNaki(e) ? 2 : 1),
      0,
    );
  }

  it("一巡するまで同じ問題を出さず、一巡で範囲の問題をすべて出す", () => {
    for (const seed of [1, 2, 3]) {
      const size = poolSize();
      const round = play(size, seed);
      expect(new Set(round.map(key)).size).toBe(size);
    }
  });

  it("二巡目も一巡目と同じく重複なく出し切る", () => {
    const size = poolSize("kuisagari");
    const asked = play(size * 2, 7, "kuisagari");
    expect(new Set(asked.slice(size).map(key)).size).toBe(size);
  });

  it("巡の変わり目を含めて、同じ問題を続けて出さない", () => {
    const asked = play(poolSize("kuisagari") * 5, 11, "kuisagari");
    for (let i = 1; i < asked.length; i++) {
      expect(key(asked[i])).not.toBe(key(asked[i - 1]));
    }
  });

  it("残りに違う役があれば、直前と同じ役（門前 / 鳴き違い）は出さない", () => {
    const all = play(poolSize(), 5);
    const yakuhaiNaki = all.find((q) => q.yakuName === "役牌" && !q.isMenzen);
    const yakuhaiMenzen = all.find((q) => q.yakuName === "役牌" && q.isMenzen);
    const other = all.find((q) => q.yakuName !== "役牌");
    if (!yakuhaiNaki || !yakuhaiMenzen || !other) throw new Error("母集団");
    const rest = all.filter(
      (q) => key(q) !== key(yakuhaiNaki) && key(q) !== key(other),
    );
    // 役牌（門前）を最後に出した。残りは役牌（鳴き）と別の役 1 つ
    const asked = [
      ...rest.filter((q) => key(q) !== key(yakuhaiMenzen)),
      yakuhaiMenzen,
    ];
    for (const seed of [1, 2, 3, 4, 5]) {
      expect(key(generateYakuHanQuestion("all", asked, mulberry32(seed)))).toBe(
        key(other),
      );
    }
    // 別の役も出し終えたら、残りの役牌（鳴き）を続けて出す
    expect(
      key(generateYakuHanQuestion("all", [...asked, other], mulberry32(1))),
    ).toBe(key(yakuhaiNaki));
  });

  it("出題範囲の外の問題は履歴にあっても数えない", () => {
    const outside = play(poolSize("no-kuisagari"), 3, "no-kuisagari");
    const size = poolSize("kuisagari");
    const rng = mulberry32(9);
    const asked: YakuHanQuestion[] = [...outside];
    for (let i = 0; i < size; i++) {
      asked.push(generateYakuHanQuestion("kuisagari", asked, rng));
    }
    expect(new Set(asked.slice(outside.length).map(key)).size).toBe(size);
  });
});

describe("getYakuHanEntries", () => {
  it("食い下がりなしは役満も食い下がり役も含まない（翻数 1〜3）", () => {
    const entries = getYakuHanEntries("no-kuisagari");
    expect(entries.length).toBeGreaterThan(0);
    for (const e of entries) {
      expect(e.menzenHan).toBeLessThan(YAKUMAN_HAN);
      // 食い下がりなし = nakiHan 未定義 or menzenHan と同じ
      expect(e.nakiHan === undefined || e.nakiHan === e.menzenHan).toBe(true);
    }
  });

  it("食い下がりありは門前と鳴きで翻数が異なる役のみ", () => {
    const entries = getYakuHanEntries("kuisagari");
    expect(entries.length).toBe(6);
    for (const e of entries) {
      expect(e.nakiHan).toBeDefined();
      expect(e.nakiHan).not.toBe(e.menzenHan);
    }
  });

  it("すべては全エントリを含む", () => {
    expect(getYakuHanEntries("all")).toHaveLength(YAKU_HAN_ENTRIES.length);
  });
});

describe("normalizeYakuHanRange", () => {
  it("妥当な値はそのまま返す", () => {
    expect(normalizeYakuHanRange("kuisagari")).toBe("kuisagari");
    expect(normalizeYakuHanRange("no-kuisagari")).toBe("no-kuisagari");
    expect(normalizeYakuHanRange("all")).toBe("all");
  });

  it("不正な値・未指定は既定値にフォールバックする", () => {
    expect(normalizeYakuHanRange(undefined)).toBe("all");
    expect(normalizeYakuHanRange("invalid")).toBe("all");
  });
});
