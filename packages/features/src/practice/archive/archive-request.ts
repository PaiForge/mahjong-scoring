import {
  ARCHIVE_SCHEMA_VERSION,
  toAgariProblemPayload,
  toTenpaiProblemPayload,
  type PracticeProblemArchiveRequest,
  type ScoreQuestion,
  type TenpaiScoreQuestion,
} from "@mahjong-scoring/core";

/**
 * 和了形の点数計算の問題から保存 API の要求を作る
 * 和了形問題保存要求
 *
 * 盤面は core の {@link toAgariProblemPayload} の出力をそのまま載せる
 * （サーバーの検証が求める並び（チーの牌の昇順など）を満たすため、ここで組み替えない）。
 *
 * @param question 採用された和了形の問題
 */
export function agariArchiveRequestOf(
  question: ScoreQuestion,
): PracticeProblemArchiveRequest {
  return {
    kind: "agari-score",
    schemaVersion: ARCHIVE_SCHEMA_VERSION,
    payload: toAgariProblemPayload(question),
  };
}

/**
 * 聴牌形の点数計算の問題から保存 API の要求を作る
 * 聴牌形問題保存要求
 *
 * 盤面は core の {@link toTenpaiProblemPayload} の出力をそのまま載せる。
 *
 * @param question 採用された聴牌形の問題
 */
export function tenpaiArchiveRequestOf(
  question: TenpaiScoreQuestion,
): PracticeProblemArchiveRequest {
  return {
    kind: "tenpai-score",
    schemaVersion: ARCHIVE_SCHEMA_VERSION,
    payload: toTenpaiProblemPayload(question),
  };
}
