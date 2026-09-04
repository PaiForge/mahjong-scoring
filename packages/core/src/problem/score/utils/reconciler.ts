import type {
  HaiKindId,
  Tehai14,
  Kazehai,
  RuleConfig,
  ScoreResult,
} from "@pai-forge/riichi-mahjong";
import type { YakuDetail } from "../types";
import { recalculateScore } from "../../../score/calculator";
import { countDoraInTehai } from "../../../core/dora";
import { isOya } from "../../../core/kaze";

/**
 * リーチ・裏ドラ適用の結果
 * リーチ裏ドラ適用結果
 */
interface ApplyRiichiResult {
  readonly answer: ScoreResult;
  readonly additionalYakuDetails: readonly YakuDetail[];
}

/**
 * リーチ・裏ドラを適用した点数を求める
 * リーチ裏ドラ適用
 *
 * 「リーチを適用する」ことが確定した手牌にのみ呼ぶ純粋関数。
 * 門前判定・リーチ有無・ダブル立直・裏ドラ表示牌の抽選は呼び出し側の責務とし、
 * この関数は与えられた条件から翻数と点数を導出するだけに留める
 * （出題側の乱数とこの関数の乱数が二重に走る構造を避けるため）。
 */
export function applyRiichiAndUraDora(input: {
  readonly tehai: Tehai14;
  readonly currentAnswer: ScoreResult;
  /** 裏ドラ表示牌（呼び出し側で generateDoraMarkers して渡す） */
  readonly uraDoraMarkers: readonly HaiKindId[];
  readonly isDoubleRiichi: boolean;
  readonly isTsumo: boolean;
  readonly jikaze: Kazehai;
  /** 点数区分に効くルール設定（切り上げ満貫）。元の点数計算と同じものを渡す */
  readonly ruleConfig?: RuleConfig;
}): ApplyRiichiResult {
  const {
    tehai,
    currentAnswer,
    uraDoraMarkers,
    isDoubleRiichi,
    isTsumo,
    jikaze,
    ruleConfig,
  } = input;

  const riichiHan = isDoubleRiichi ? 2 : 1;
  const riichiName = isDoubleRiichi ? "ダブル立直" : "立直";

  // 裏ドラ翻数は表示牌から手牌を照合して算出する（表示牌と翻数の不一致を防ぐ）
  const uraHan = countDoraInTehai(tehai, uraDoraMarkers);

  const additionalYakuDetails: readonly YakuDetail[] = [
    { name: riichiName, han: riichiHan },
    ...(uraHan > 0 ? [{ name: "裏ドラ", han: uraHan }] : []),
  ];

  const newHan = currentAnswer.han + riichiHan + uraHan;
  const answer = recalculateScore(currentAnswer, newHan, {
    isTsumo,
    isOya: isOya(jikaze),
    ruleConfig,
  });

  return { answer, additionalYakuDetails };
}
