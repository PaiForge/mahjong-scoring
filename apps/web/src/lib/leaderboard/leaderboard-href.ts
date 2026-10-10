import type { LeaderboardPeriod } from "@mahjong-scoring/features/leaderboard/boards";
import {
  menuTypeToSlug,
  type PracticeBoard,
} from "@mahjong-scoring/features/practice-menu-types";
import {
  LEADERBOARD_PATH,
  variantQuery,
} from "@mahjong-scoring/features/routes";

/**
 * ある土俵・期間のランキングのパス
 * ランキング詳細パス
 *
 * バリアントを持つ練習だけクエリで土俵を指す。持たない練習に付けても
 * 意味が無く、URL が長くなるだけ。
 *
 * ランキングの詳細は web だけにある（アプリは他の利用者を見せない。
 * `apps/mobile/CLAUDE.md`）ので、両プラットフォームの遷移先を置く
 * `@mahjong-scoring/features/routes` ではなくここに置く。
 */
export function leaderboardHref(
  period: LeaderboardPeriod,
  board: PracticeBoard,
): string {
  const slug = menuTypeToSlug(board.menuType);
  return `${LEADERBOARD_PATH}/${period}/${slug}${variantQuery(slug, board.variant)}`;
}
