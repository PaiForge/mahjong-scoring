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
  return `/reference?role=${role}&winType=${winType}&han=${result.han}&fu=${result.fu}`;
}
