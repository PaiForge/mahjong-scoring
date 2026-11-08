import {
  menuTypeToMessageKey,
  practiceMenuByType,
} from "../practice-menu-types";
import type { PracticeBoard } from "../practice-menu-types";

/** next-intl のルート翻訳関数（`useTranslations()` / `getTranslations()` の戻り値） */
type RootTranslator = (key: string, values?: Record<string, string>) => string;

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
 *
 * 括弧の付け方は練習へのリンクの表題と同じ辞書の `practice.titleWithVariant` が
 * 決める（日本語は全角の括弧で従来と同じ文字列。英語は半角の括弧）。
 */
export function boardLabel(board: PracticeBoard, t: RootTranslator): string {
  // 例: practice.practices.scoreTable.shortTitle / scoreTableChallenge.variants.all.label（完成形のキーで grep したときにここへ着地させるための例）
  const title = t(
    `practice.practices.${menuTypeToMessageKey(board.menuType)}.shortTitle`,
  );
  const { hasSetup, namespace } = practiceMenuByType(board.menuType);
  if (!hasSetup) return title;
  return t("practice.titleWithVariant", {
    title,
    variant: t(`${namespace}.variants.${board.variant}.label`),
  });
}
