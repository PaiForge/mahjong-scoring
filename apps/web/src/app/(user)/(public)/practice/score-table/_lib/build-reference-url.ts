import type { ScoreTableQuestionResult } from "./types";

/**
 * 点数表ドリルの問題結果から点数表参照ページへのURLを生成する
 * 点数表リンクURL生成
 */
export function buildReferenceUrl(result: ScoreTableQuestionResult): string {
  const role = result.isOya ? "oya" : "ko";
  const winType = result.isTsumo ? "tsumo" : "ron";
  return `/reference?role=${role}&winType=${winType}&han=${result.han}&fu=${result.fu}`;
}
