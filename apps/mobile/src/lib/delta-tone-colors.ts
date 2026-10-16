import type { DeltaTone } from "@mahjong-scoring/features/challenge/signed-delta";

import { colors } from "./theme";

/**
 * 増減トーンごとの文字色（web の `DELTA_TONE_CLASSES`）
 * 増減トーン配色
 *
 * マイレコードの統計カードと結果画面の記録の節が共有する。
 */
export const DELTA_TONE_COLORS: Readonly<Record<DeltaTone, string>> = {
  up: colors.success,
  down: colors.destructive,
  flat: colors.surface500,
};
