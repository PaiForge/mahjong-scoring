import { boardLabel } from "../my-record/board-label";
import {
  menuTypeToMessageKey,
  practiceMenuByType,
  type PracticeBoard,
} from "../practice-menu-types";

/** next-intl のルート翻訳関数（`useTranslations()` / `getTranslations()` の戻り値） */
type RootTranslator = (key: string) => string;

/**
 * ランキングでの土俵の表示名
 * ランキング土俵名
 *
 * 練習の土俵が 1 つだけ（出題範囲を選べる練習も「すべて」だけが載る）なら
 * 練習の短い名だけを出す。ランキングの一覧に範囲を選べない練習と並べたとき、
 * 「合計符（すべて）」の括弧は見分けに使われず、範囲を絞った土俵もあるかの
 * ように読める。土俵が複数ある練習は {@link boardLabel} と同じく範囲名を添える。
 *
 * web のランキング（`boardTitle`）とアプリの順位の一覧で共有する。
 */
export function leaderboardBoardLabel(
  board: PracticeBoard,
  t: RootTranslator,
): string {
  if (practiceMenuByType(board.menuType).rankedVariants.length > 1) {
    return boardLabel(board, t);
  }
  return t(
    `practice.practices.${menuTypeToMessageKey(board.menuType)}.shortTitle`,
  );
}
