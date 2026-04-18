export type { ScoreQuestionResult as ManganScoreCalculationQuestionResult } from "../../_lib/score-question-result";
export { parseQuestionResults } from "../../_lib/score-question-result";
export { paymentToScoreTableAnswer } from "../../_lib/payment-adapter";

/** sessionStorage に保存する際のキー */
export const RESULT_STORAGE_KEY = "mangan-score-calculation-results";

/**
 * player クエリパラメータの型
 * プレイヤー種別
 */
export type PlayerType = "child" | "parent" | "random";

/**
 * player クエリパラメータをパースする
 * プレイヤー種別パース
 */
export function parsePlayerType(value: string | undefined): PlayerType {
  if (value === "child" || value === "parent") return value;
  return "random";
}

/**
 * PlayerType から includeParent / includeChild オプションを導出する
 * プレイヤー種別オプション変換
 */
export function playerTypeToOptions(playerType: PlayerType): { includeParent: boolean; includeChild: boolean } {
  switch (playerType) {
    case "child":
      return { includeParent: false, includeChild: true };
    case "parent":
      return { includeParent: true, includeChild: false };
    case "random":
      return { includeParent: true, includeChild: true };
  }
}
