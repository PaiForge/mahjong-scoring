import { afterEach, describe, expect, it, vi } from "vitest";
import { MentsuType } from "@pai-forge/riichi-mahjong";
import { generateMentsuFuQuestion } from "./generator";

/**
 * 面子符問題のジェネレータは乱数源を引数に取らず `Math.random` を直接引く。
 * 面子の種別の重み（順子 2 割・刻子 5 割・残りが槓子）を決定的に確かめるため、
 * `Math.random` を固定値に差し替えて種別の境界を挟む。
 */
function generateWithRandom(value: number) {
  vi.spyOn(Math, "random").mockReturnValue(value);
  return generateMentsuFuQuestion(() => "question-id");
}

describe("generateMentsuFuQuestion", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("乱数が順子の重み（0.2）未満なら順子を出す", () => {
    expect(generateWithRandom(0.19).mentsu.type).toBe(MentsuType.Shuntsu);
  });

  it("順子の重みから刻子の重みを足した 0.7 未満までは刻子を出す", () => {
    expect(generateWithRandom(0.21).mentsu.type).toBe(MentsuType.Koutsu);
    expect(generateWithRandom(0.69).mentsu.type).toBe(MentsuType.Koutsu);
  });

  it("0.7 以上は槓子を出す", () => {
    expect(generateWithRandom(0.71).mentsu.type).toBe(MentsuType.Kantsu);
  });

  it("問題の ID は渡した生成器から取り、答えは面子の符と一致する", () => {
    // 0.71 は槓子・么九牌でない・鳴いていない（どちらも 0.5 以上で false）→ 中張牌の暗槓は 16 符
    const question = generateWithRandom(0.71);
    expect(question.id).toBe("question-id");
    expect(question.answer).toBe(16);
  });
});
