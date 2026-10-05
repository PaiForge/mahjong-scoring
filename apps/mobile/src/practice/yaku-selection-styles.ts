import type { TextStyle } from "react-native";
import type { YakuSelectionState } from "@mahjong-scoring/core";

import { colors } from "../lib/theme";

/**
 * 役の答え合わせの配色（web の `YAKU_SELECTION_CLASSES`）
 * 役別判定配色
 *
 * 緑 = 選んで合っていた / 赤 = 選んだが成立していない / 黄 = 選び忘れ。
 * 役判定練習と点数計算の結果で色の意味づけを揃えるため、対応はここ 1 箇所で持つ。
 * 枠・背景・文字色を 1 つのスタイルで返す（Text にそのまま当てられる）。
 */
export const YAKU_SELECTION_STYLES: Readonly<
  Record<YakuSelectionState, TextStyle>
> = {
  correct: {
    borderColor: colors.primary500,
    backgroundColor: colors.primary50,
    color: colors.primary700,
  },
  incorrect: {
    borderColor: colors.destructive,
    backgroundColor: colors.destructiveSubtle,
    color: colors.destructiveStrong,
  },
  missed: {
    borderColor: colors.warning,
    backgroundColor: colors.warningSubtle,
    color: colors.warningStrong,
  },
};
