import { REFERENCE_YAKU_PATH } from "@mahjong-scoring/features/routes";

/** 役一覧で開いておく役を受け取るクエリの名前 */
export const YAKU_FOCUS_PARAM = "yaku";

/**
 * 役一覧の特定の役へのパス（モバイル）
 * 役一覧リンク
 *
 * web は `/reference/yaku#yaku-<役名>` のアンカーで着地させるが、モバイルの
 * 画面はアンカーを持たないので、開いておく役をクエリで渡す（役一覧が
 * その役を開いてスクロールする）。
 */
export function referenceYakuHref(yakuName: string): string {
  return `${REFERENCE_YAKU_PATH}?${YAKU_FOCUS_PARAM}=${encodeURIComponent(yakuName)}`;
}
