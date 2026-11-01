import type { RankSlug } from "@mahjong-scoring/features/ranks/registry";
import { LESSONS_PATH } from "@mahjong-scoring/features/routes";

/**
 * レッスンの目次（`/lessons`）を段級位で絞るクエリパラメータ名。
 *
 * 練習一覧の `?rank=`（`PRACTICE_RANK_PARAM`）と同じ名前・同じ値（級の slug）に
 * そろえる。目次は完了を cookie から読む動的ルートなので、練習一覧と違い
 * サーバーで `searchParams` を読んでよい。
 */
export const LESSONS_RANK_PARAM = "rank";

/**
 * レッスンの目次のパス。級を渡すとその級の前提レッスンだけに絞った目次を開く。
 * レッスン目次パス
 *
 * @param rank 絞る級。省略すると全レッスン
 */
export function lessonsListHref(rank?: RankSlug): string {
  if (rank === undefined) return LESSONS_PATH;
  return `${LESSONS_PATH}?${LESSONS_RANK_PARAM}=${rank}`;
}
