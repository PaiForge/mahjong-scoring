import {
  DEFAULT_VARIANT,
  isPracticeMenuType,
} from "@/lib/db/practice-menu-types";

import { isMyRecordBoard } from "./menu-scope";
import type { RecordBoard } from "./types";

/** Next.js の searchParams（解決済み） */
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
): RecordBoard | undefined {
  const menu = params.menu;
  if (typeof menu !== "string" || !isPracticeMenuType(menu)) return undefined;

  const variant = params.variant;
  const board: RecordBoard = {
    menuType: menu,
    variant: typeof variant === "string" ? variant : DEFAULT_VARIANT,
  };
  return isMyRecordBoard(board) ? board : undefined;
}
