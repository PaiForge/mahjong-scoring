import {
  countDora,
  type HaiKindId,
  type Tehai14,
  type Kazehai,
  type RuleConfig,
  type ScoreResult,
  type YakuResult,
} from "@pai-forge/riichi-mahjong";
import type { YakuDetail } from "../types";
import { recalculateScore } from "../../../score/calculator";
import { isOya } from "../../../core/kaze";
import { SCORE_YAKU_NAME_MAP, hasYakumanYaku } from "../../../core/yaku-names";

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

/**
 * リーチしている手の追加情報（裏ドラ表示牌）
 * リーチ入力
 */
export interface RiichiInput {
  readonly uraDoraMarkers: readonly HaiKindId[];
}

/**
 * ライブラリの点数計算結果に、アプリが後付けする採点規則を適用する
 * 採点規則適用
 *
 * ライブラリは立直を判定しない（宣言を要する役）ので、立直の 1 翻と裏ドラは
 * アプリが足す。ただし役満の手には乗せない — 役満は通常役と複合せず、
 * ライブラリも役満の手では通常役を返さない（{@link hasYakumanYaku}）。
 * 役満の手ではライブラリが翻数に足している表ドラも落とし、翻数を役満の翻に
 * 揃える（支払いは役満単位で固定なので点数は変わらない）。
 *
 * 問題の正解（`buildScoreQuestion`）と、面子分解の候補ごとの点数
 * （`resolveMentsuBreakdowns`）が同じ規則を通るための共通処理。候補だけが
 * 表ドラまでで止まると、リーチの手で正解の翻数とタブの翻数が食い違う。
 *
 * @returns 規則を適用した点数と、足した役の内訳（立直・裏ドラ。無ければ空）
 */
export function applyAppScoringRules(input: {
  readonly tehai: Tehai14;
  /** ライブラリの点数計算結果（表ドラまで乗った翻数） */
  readonly answer: ScoreResult;
  /** その解釈で成立した役（役満かどうかの判定に使う） */
  readonly yakuResult: YakuResult;
  readonly isTsumo: boolean;
  readonly jikaze: Kazehai;
  readonly ruleConfig?: RuleConfig;
  /** リーチしていれば渡す */
  readonly riichi?: RiichiInput;
}): ApplyRiichiResult {
  const { tehai, answer, yakuResult, isTsumo, jikaze, ruleConfig, riichi } =
    input;

  if (hasYakumanYaku(yakuResult)) {
    const yakumanHan = yakuResult.reduce((total, [, han]) => total + han, 0);
    return {
      answer:
        answer.han === yakumanHan
          ? answer
          : recalculateScore(answer, yakumanHan, {
              isTsumo,
              isOya: isOya(jikaze),
              ruleConfig,
            }),
      additionalYakuDetails: [],
    };
  }

  if (!riichi) return { answer, additionalYakuDetails: [] };

  return applyRiichiAndUraDora({
    tehai,
    currentAnswer: answer,
    uraDoraMarkers: riichi.uraDoraMarkers,
    isTsumo,
    jikaze,
    ruleConfig,
  });
}
