import { describe, expect, it } from "vitest";
import {
  SCORE_YAKU_NAME_MAP,
  YAKU_OPTIONS,
  isAnswerYakuId,
  scoreYakuIdOfName,
} from "./yaku-names";

describe("永続化する役ID", () => {
  it("日本語名の逆引きが一意で、すべての回答の選択肢を往復できる", () => {
    const names = Object.values(SCORE_YAKU_NAME_MAP);
    expect(new Set(names).size).toBe(names.length);
    for (const name of YAKU_OPTIONS) {
      const id = scoreYakuIdOfName(name);
      expect(isAnswerYakuId(id)).toBe(true);
      if (id !== undefined) expect(SCORE_YAKU_NAME_MAP[id]).toBe(name);
    }
  });
  it("場風・自風の内訳は保存できるが回答としては選べない", () => {
    expect(scoreYakuIdOfName("場風牌")).toBe("Bakaze");
    expect(isAnswerYakuId("Bakaze")).toBe(false);
    expect(isAnswerYakuId("Ton")).toBe(true);
    expect(scoreYakuIdOfName("ドラ")).toBeUndefined();
  });
});
