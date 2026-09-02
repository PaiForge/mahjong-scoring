import { describe, expect, it } from "vitest";
import { calculateExp } from "@mahjong-scoring/core";

import { PRACTICE_MENU_TYPES, isExamMenuType } from "../practice-menu-types";

/**
 * core の MODULE_WEIGHT と web の PRACTICE_MENU_REGISTRY の対応を守る。
 *
 * core は web に依存できないため MODULE_WEIGHT のキーは string 型で、
 * 練習を追加しても型エラーにならない。実際 yaku_han と
 * mangan_score_calculation は稼働中なのに重みが未登録で、EXP が
 * サイレントに付与されていなかった。ここで突き合わせて再発を防ぐ。
 *
 * 昇級試験は逆に「登録されていない」ことを検査する。EXP は反復の報酬で、
 * 試験の成果は段級位が表すため付与しない（MODULE_WEIGHT の TSDoc 参照）。
 */
describe("MODULE_WEIGHT の網羅性", () => {
  it.each(PRACTICE_MENU_TYPES.filter((menuType) => !isExamMenuType(menuType)))(
    "%s は EXP 付与対象として登録されている",
    (menuType) => {
      const result = calculateExp({
        score: 10,
        incorrectAnswers: 0,
        menuType,
      });

      expect(
        result,
        `${menuType} が MODULE_WEIGHT に未登録のため EXP が付与されない`,
      ).toBeDefined();
      expect(result?.totalExp).toBeGreaterThan(0);
    },
  );

  it.each(PRACTICE_MENU_TYPES.filter(isExamMenuType))(
    "昇級試験 %s は EXP 付与対象に登録されていない",
    (menuType) => {
      const result = calculateExp({
        score: 10,
        incorrectAnswers: 0,
        menuType,
      });

      expect(result, `${menuType} に EXP が付与されてしまう`).toBeUndefined();
    },
  );

  it("未登録の menuType は undefined を返す（ホワイトリスト方式が機能している）", () => {
    const result = calculateExp({
      score: 10,
      incorrectAnswers: 0,
      menuType: "not_a_real_practice",
    });

    expect(result).toBeUndefined();
  });
});
