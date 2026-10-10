import { DEFAULT_VARIANT, isPracticeMenuType } from "../practice-menu-types";

import { isMyRecordBoard } from "./menu-scope";
import type { PracticeBoard } from "../practice-menu-types";

/** URL クエリ（Next.js の解決済み searchParams・expo-router の useLocalSearchParams と同じ形） */
type ResolvedSearchParams = Record<
  string,
  string | readonly string[] | undefined
>;

/**
 * URL クエリ `?menu=&variant=` からマイレコードの土俵を読む
 * 要求土俵解決
 *
 * 練習結果ページの「マイレコードで推移を見る」と全履歴のページ送りが付ける。
 * `variant` が無ければ既定（設定を持たない練習の唯一の土俵）とみなす。
 * マイレコードが扱わない種別・その練習に無いバリアントは undefined
 * （呼び出し側は「指定なし」として扱う）。
 */
export function resolveRequestedBoard(
  params: ResolvedSearchParams,
): PracticeBoard | undefined {
  const menu = params.menu;
  if (typeof menu !== "string" || !isPracticeMenuType(menu)) return undefined;

  const variant = params.variant;
  const board: PracticeBoard = {
    menuType: menu,
    variant: typeof variant === "string" ? variant : DEFAULT_VARIANT,
  };
  return isMyRecordBoard(board) ? board : undefined;
}
