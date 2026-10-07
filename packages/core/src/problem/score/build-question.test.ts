import { describe, expect, it } from "vitest";
import {
  HaiKind,
  validateTehai14,
  type HaiKindId,
} from "@pai-forge/riichi-mahjong";
import { buildScoreQuestion } from "./build-question";
import { parseTehai } from "./mpsz-serializer";
import { ScoreLevel } from "../../core/constants";
import { YAKUMAN_HAN } from "../../score/tiers";

/** MPSZ の 14 枚を和了形の手牌にする */
function agariTehai(mpsz: string) {
  const tehai = parseTehai(mpsz);
  if (tehai === undefined) throw new Error(mpsz);
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
    // 表ドラ表示牌は發 → ドラは中（手牌に 3 枚）。裏ドラ表示牌は南 → 西（手牌に無い）
    doraMarkers: [HaiKind.Hatsu],
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

  it("採点に使ったルール設定を問題に残す", () => {
    const ruleConfig = { doubleWindJantouFu: 4, kiriageMangan: true } as const;
    const built = buildScoreQuestion({
      ...base,
      ruleConfig,
      agariHai: HaiKind.Haku,
      isTsumo: true,
    });

    expect(built._unsafeUnwrap().ruleConfig).toEqual(ruleConfig);
  });

  it("役満の手にはリーチしていても立直・裏ドラ・ドラを乗せない", () => {
    // 役満は通常役と複合しない。ライブラリが役満の手で通常役を返さないのと
    // 同じ規則を、アプリが後付けする立直・裏ドラ・ドラにも適用する
    for (const isTsumo of [true, false]) {
      const { question, names } = yakuNames(HaiKind.Haku, isTsumo);

      expect(names).toEqual(["四暗刻"]);
      expect(question.answer.scoreLevel).toBe(ScoreLevel.Yakuman);
      // 翻数は役満の翻そのもの（ライブラリが足すドラの翻も内訳に合わせて落とす）
      expect(question.answer.han).toBe(YAKUMAN_HAN);
      // リーチ棒と裏ドラ表示牌は盤面の状態として残る
      expect(question.isRiichi).toBe(true);
      expect(question.uraDoraMarkers).toEqual(base.riichi.uraDoraMarkers);
    }
  });

  it("同じ聴牌形でも通常手になる和了なら立直とドラが乗る", () => {
    // 待ち別点数計算では待ちごとにここを通るので、役満になる待ちだけ
    // 立直・ドラが外れ、ならない待ちには乗る
    const { question, names } = yakuNames(HaiKind.Chun, false);

    expect(names).not.toContain("四暗刻");
    expect(names).toContain("立直");
    expect(question.yakuDetails).toContainEqual({ name: "ドラ", han: 3 });
    expect(question.answer.han).toBe(
      question.yakuDetails!.reduce((sum, yaku) => sum + yaku.han, 0),
    );
    expect(question.isRiichi).toBe(true);
  });
});
