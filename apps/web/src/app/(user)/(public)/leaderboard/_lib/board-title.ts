import { getTranslations } from "next-intl/server";

import { leaderboardBoardLabel } from "@mahjong-scoring/features/leaderboard/board-label";
import type { PracticeBoard } from "@mahjong-scoring/features/practice-menu-types";

/**
 * ランキングでの土俵の表示名
 * 土俵名
 *
 * 規則は `leaderboardBoardLabel`（アプリの順位の一覧と同じ）。
 * サーバーコンポーネント専用（`getTranslations`）。
 */
export async function boardTitle(board: PracticeBoard): Promise<string> {
  const t = await getTranslations();
  return leaderboardBoardLabel(board, t);
}
