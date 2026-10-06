import { describe, expect, it } from "vitest";
import {
  HaiKind,
  validateTehai14,
  type HaiKindId,
} from "@pai-forge/riichi-mahjong";
import { buildScoreQuestion } from "./build-question";
import { parseTehai } from "./mspz-serializer";
import { ScoreLevel } from "../../core/constants";

/** MSPZ の 14 枚を和了形の手牌にする */
function agariTehai(mspz: string) {
  const tehai = parseTehai(mspz);
  if (tehai === undefined) throw new Error(mspz);
  return validateTehai14(tehai)._unsafeUnwrap();
}

describe("buildScoreQuestion", () => {
  // 四暗刻の形（白の単騎）。白をツモれば四暗刻、中をロンすると中の刻子が
  // 明刻になって三暗刻 + 対々和 + 役牌 中 の通常手になる
  const tehai = agariTehai("111m222p333s55z777z");
  const base = {
    tehai,
    jikaze: HaiKind.Ton,
    bakaze: HaiKind.Ton,
    // 表示牌はどちらも手牌の外で、指すドラも手牌に無い（内訳を役だけにする）
    doraMarkers: [HaiKind.Ton],
    ruleConfig: {},
    riichi: { uraDoraMarkers: [HaiKind.Nan] },
  } as const;

  function yakuNames(agariHai: HaiKindId, isTsumo: boolean) {
    const built = buildScoreQuestion({ ...base, agariHai, isTsumo });
    const question = built._unsafeUnwrap();
    return {
      question,
      names: (question.yakuDetails ?? []).map((yaku) => yaku.name),
    };
  }

  it("役満の手にはリーチしていても立直と裏ドラを乗せない", () => {
    // 役満は通常役と複合しない。ライブラリが役満の手で通常役を返さないのと
    // 同じ規則を、アプリが後付けする立直・裏ドラにも適用する
    for (const isTsumo of [true, false]) {
      const { question, names } = yakuNames(HaiKind.Haku, isTsumo);

      expect(names).toEqual(["四暗刻"]);
      expect(question.answer.scoreLevel).toBe(ScoreLevel.Yakuman);
      // 翻数は内訳の合計のまま（立直の 1 翻で崩れない）
      expect(question.answer.han).toBe(
        question.yakuDetails!.reduce((sum, yaku) => sum + yaku.han, 0),
      );
      // リーチ棒と裏ドラ表示牌は盤面の状態として残る
      expect(question.isRiichi).toBe(true);
      expect(question.uraDoraMarkers).toEqual(base.riichi.uraDoraMarkers);
    }
  });

  it("同じ聴牌形でも通常手になる和了なら立直が乗る", () => {
    // 待ち別点数計算では待ちごとにここを通るので、役満になる待ちだけ
    // 立直が外れ、ならない待ちには乗る
    const { question, names } = yakuNames(HaiKind.Chun, false);

    expect(names).not.toContain("四暗刻");
    expect(names).toContain("立直");
    expect(question.isRiichi).toBe(true);
  });
});
