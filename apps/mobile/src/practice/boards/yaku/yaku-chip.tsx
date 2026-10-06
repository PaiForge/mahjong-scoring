import { StyleSheet, Text } from "react-native";
import type { YakuSelectionState } from "@mahjong-scoring/core";

import { radius } from "../../../lib/theme";
import { YAKU_SELECTION_STYLES } from "../../yaku-selection-styles";

/**
 * 答え合わせの役チップ（web の `YakuChip`）
 * 役チップ
 *
 * 選択を変えない表示専用のピル。色はその役をどう扱ったか（core の
 * `judgeYakuName`）で決まる。web は早見表に載る役を押すと役一覧モーダルが
 * 開くが、モバイルにはまだ役一覧が無いため押せない。
 */
export function YakuChip({
  label,
  feedbackState,
}: {
  /** 画面に出す表示名 */
  readonly label: string;
  /** その役をどう扱ったか */
  readonly feedbackState: YakuSelectionState;
}) {
  return (
    <Text style={[styles.chip, YAKU_SELECTION_STYLES[feedbackState]]}>
      {label}
    </Text>
  );
}

const styles = StyleSheet.create({
  chip: {
    overflow: "hidden",
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 12,
    fontWeight: "500",
  },
});
