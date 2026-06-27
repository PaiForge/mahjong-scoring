import type { ScoreQuestionResult } from "./score-question-result";

/**
 * 点数系練習の問題結果から点数表参照ページへのURLを生成する
 * 点数表リンクURL生成
 */
export function buildReferenceUrl(
  result: Pick<ScoreQuestionResult, "isOya" | "isTsumo" | "han" | "fu">,
): string {
  const role = result.isOya ? "oya" : "ko";
  const winType = result.isTsumo ? "tsumo" : "ron";
  const base = `/reference?role=${role}&winType=${winType}&han=${result.han}`;
  // 満貫以上は符に依存しないため fu を持たない。その場合は fu パラメータを付けない。
  return result.fu === undefined ? base : `${base}&fu=${result.fu}`;
}
