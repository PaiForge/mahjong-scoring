import { MY_RECORD_PATH } from "@mahjong-scoring/features/routes";

/**
 * マイレコードの全履歴のページ（ロケール非依存のパス）
 *
 * ダッシュボードの「すべての結果を見る」と全履歴のページ自身（ページ送り・
 * ガードの戻り先）が同じ文字列を使う。
 */
export const MY_RECORD_RESULTS_PATH = `${MY_RECORD_PATH}/results`;
