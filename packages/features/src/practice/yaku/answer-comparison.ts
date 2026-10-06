import { judgeYakuName } from "@mahjong-scoring/core";
import type { YakuSelectionState } from "@mahjong-scoring/core";
import {
  parseMarkers,
  restoreTehaiQuestion,
} from "../../results/parse-question-tiles";
import { AnswerOutcome } from "../../results/result-schemas";
import type { YakuQuestionResult } from "./types";

/**
 * 保存された結果から出題内容を復元する
 * 役出題復元
 *
 * MSPZ のパースに失敗した場合は undefined を返し、手牌の再表示だけを諦める
 * （役の対比は文字列に依存しないため表示できる）。
 */
export function restoreYakuQuestion(result: YakuQuestionResult) {
  const restored = restoreTehaiQuestion(result);
  if (!restored) return undefined;
  return {
    tehai: restored.tehai,
    context: {
      ...restored.context,
      isRiichi: result.isRiichi,
      doraMarkers: parseMarkers(result.doraMarkers) ?? [],
      uraDoraMarkers: parseMarkers(result.uraDoraMarkers),
    },
  };
}

/**
 * 役の答え合わせに並べるチップ 1 つ
 * 役答え合わせチップ
 */
export interface YakuComparisonChip {
  readonly yakuName: string;
  /** 選べた役は correct、選び忘れは missed、余分に選んだ役は incorrect */
  readonly state: YakuSelectionState;
}

/**
 * 役の答え合わせのチップを組み立てる
 * 役答え合わせチップ構築
 *
 * 役名は表示順（`yakuOrder`）に並べ、選択順・判定順のばらつきを見せない。
 * 状態は core の `judgeYakuName` が決める。時間切れは比べる回答が無いため、
 * 成立していた役を選び忘れ（missed）ではなく成立（correct）で出す。
 *
 * @param names チップにする役名（成立していた役 / あなたの回答）
 * @param yakuOrder 役の表示順
 * @param correctYakuNames 成立していた役
 * @param selectedYakuNames ユーザーが選んだ役。時間切れでは undefined
 * @param outcome 1 問の顛末。無回答のまま開示したときは undefined
 */
export function buildYakuComparisonChips(
  names: readonly string[],
  yakuOrder: readonly string[],
  correctYakuNames: readonly string[],
  selectedYakuNames: readonly string[] | undefined,
  outcome: AnswerOutcome | undefined,
): readonly YakuComparisonChip[] {
  const judgedSelection =
    outcome === AnswerOutcome.TimeUp
      ? correctYakuNames
      : (selectedYakuNames ?? []);
  return yakuOrder
    .filter((yakuName) => names.includes(yakuName))
    .map((yakuName) => ({
      yakuName,
      state: judgeYakuName(yakuName, judgedSelection, correctYakuNames),
    }));
}
