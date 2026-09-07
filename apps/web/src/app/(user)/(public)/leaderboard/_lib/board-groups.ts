import {
  PRACTICE_CATEGORIES,
  practiceMenuFromCatalog,
  type PracticeCategory,
} from "@/app/(user)/(public)/practice/_lib/practice-catalog";

import type { LeaderboardBoard } from "./types";
import { BOARDS, moduleToSlug } from "./types";

/** 1 つの分野に属する土俵のまとまり */
export interface LeaderboardBoardGroup {
  readonly category: PracticeCategory;
  /** {@link BOARDS} の並びを保った、この分野の土俵 */
  readonly boards: readonly LeaderboardBoard[];
}

/** その土俵が属する分野。練習カタログ（一覧の絞り込みと同じ分類）が持つ */
function boardCategory(board: LeaderboardBoard): PracticeCategory | undefined {
  return practiceMenuFromCatalog(moduleToSlug(board.module))?.category;
}

/**
 * ランキングの土俵を分野（符の計算 / 翻数 / 点数計算）ごとにまとめる
 * 土俵の分野分け
 *
 * 一覧は 17 行あり、行頭の記号 1 つで種目を見分けさせるのは元々無理がある
 * （運べるのはせいぜい分野までで、種目そのものではない）。分野なら名前ごと
 * 見出しに出せるので、行頭には何も置かず見出しで括る。
 *
 * 分類は練習一覧の絞り込みと同じ `PRACTICE_CATALOG` の `category` を引く。
 * ランキング側に分類表を持つと、練習の分野が 2 か所で食い違う。
 *
 * 分野の並びは {@link PRACTICE_CATEGORIES}（学習順）、分野の中の並びは
 * {@link BOARDS}。土俵を持たない分野は見出しごと落とす。
 */
export function leaderboardBoardGroups(): readonly LeaderboardBoardGroup[] {
  return PRACTICE_CATEGORIES.map((category) => ({
    category,
    boards: BOARDS.filter((board) => boardCategory(board) === category),
  })).filter((group) => group.boards.length > 0);
}
