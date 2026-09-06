import {
  menuTypeToMessageKey,
  practiceMenuByType,
} from "@/lib/db/practice-menu-types";

import type { RecordBoard } from "./types";

/** next-intl のルート翻訳関数（`useTranslations()` / `getTranslations()` の戻り値） */
type RootTranslator = (key: string) => string;

/**
 * 土俵の表示名（練習の短い名 + バリアント名）
 * 土俵名
 *
 * バリアントを持つ練習は「点数表早引き（子・満貫未満）」のように設定名を
 * 添える。同じ練習の土俵が並ぶ select や履歴の表で、名前だけで見分けられる
 * ようにする。設定を持たない練習は短い名だけ。
 *
 * サーバー・クライアントの両方から使えるよう、ルートの翻訳関数を受け取る
 * 純粋関数にしている（ランキングの `boardTitle` のマイレコード版）。
 */
export function boardLabel(board: RecordBoard, t: RootTranslator): string {
  const title = t(
    `practice.practices.${menuTypeToMessageKey(board.menuType)}.shortTitle`,
  );
  const { hasSetup, namespace } = practiceMenuByType(board.menuType);
  if (!hasSetup) return title;
  return `${title}（${t(`${namespace}.variants.${board.variant}.label`)}）`;
}
