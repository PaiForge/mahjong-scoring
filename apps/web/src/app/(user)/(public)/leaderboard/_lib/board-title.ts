import { getTranslations } from "next-intl/server";

import {
  menuTypeToMessageKey,
  practiceMenuByType,
} from "@/lib/db/practice-menu-types";
import type { PracticeBoard } from "@/lib/db/practice-menu-types";

/**
 * 土俵の表示名（練習の短い名 + バリアント名）
 * 土俵名
 *
 * バリアントを持つ練習は「点数表早引き（子・満貫未満）」のように設定名を
 * 添える。同じ練習の土俵が並ぶ一覧で、名前だけで見分けられるようにする。
 * 設定を持たない練習は短い名だけ。
 *
 * サーバーコンポーネント専用（`getTranslations`）。
 */
export async function boardTitle(board: PracticeBoard): Promise<string> {
  const tPractices = await getTranslations("practice.practices");
  const title = tPractices(
    `${menuTypeToMessageKey(board.menuType)}.shortTitle`,
  );

  const { hasSetup, namespace } = practiceMenuByType(board.menuType);
  if (!hasSetup) return title;

  const tVariants = await getTranslations(`${namespace}.variants`);
  return `${title}（${tVariants(`${board.variant}.label`)}）`;
}
