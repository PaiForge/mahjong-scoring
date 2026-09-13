import {
  countDora,
  type HaiKindId,
  type Tehai14,
  type Kazehai,
  type RuleConfig,
  type ScoreResult,
} from "@pai-forge/riichi-mahjong";
import type { YakuDetail } from "../types";
import { recalculateScore } from "../../../score/calculator";
import { isOya } from "../../../core/kaze";
import { SCORE_YAKU_NAME_MAP } from "../../../core/yaku-names";

/** 立直の内訳名（`yakuDetails.name` の語彙は役名の対応表に合わせる） */
const RIICHI_NAME = SCORE_YAKU_NAME_MAP.Riichi;
/** 立直の翻数 */
const RIICHI_HAN = 1;

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
 * 門前判定・リーチ有無・裏ドラ表示牌の抽選は呼び出し側の責務とし、
 * この関数は与えられた条件から翻数と点数を導出するだけに留める
 * （出題側の乱数とこの関数の乱数が二重に走る構造を避けるため）。
 *
 * 足す翻は常に立直の 1 翻。ダブル立直を出題しない理由は
 * `build-question.ts` の `RiichiInput` を参照。
 */
export function applyRiichiAndUraDora(input: {
  readonly tehai: Tehai14;
  readonly currentAnswer: ScoreResult;
  /** 裏ドラ表示牌（呼び出し側で generateDoraMarkers して渡す） */
  readonly uraDoraMarkers: readonly HaiKindId[];
  readonly isTsumo: boolean;
  readonly jikaze: Kazehai;
  /** 点数区分に効くルール設定（切り上げ満貫）。元の点数計算と同じものを渡す */
  readonly ruleConfig?: RuleConfig;
}): ApplyRiichiResult {
  const { tehai, currentAnswer, uraDoraMarkers, isTsumo, jikaze, ruleConfig } =
    input;

  // 裏ドラ翻数は表示牌から手牌を照合して算出する（表示牌と翻数の不一致を防ぐ）
  const uraHan = countDora(tehai, uraDoraMarkers);

  const additionalYakuDetails: readonly YakuDetail[] = [
    { name: RIICHI_NAME, han: RIICHI_HAN },
    ...(uraHan > 0 ? [{ name: "裏ドラ", han: uraHan }] : []),
  ];

  const newHan = currentAnswer.han + RIICHI_HAN + uraHan;
  const answer = recalculateScore(currentAnswer, newHan, {
    isTsumo,
    isOya: isOya(jikaze),
    ruleConfig,
  });

  return { answer, additionalYakuDetails };
}
