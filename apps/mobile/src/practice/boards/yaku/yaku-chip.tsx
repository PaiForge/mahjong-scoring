import { Pressable, StyleSheet, Text } from "react-native";
import { useTranslations } from "use-intl";
import type { YakuSelectionState } from "@mahjong-scoring/core";

import { radius } from "../../../lib/theme";
import { YAKU_SELECTION_STYLES } from "../../yaku-selection-styles";

/**
 * 答え合わせの役チップ（web の `YakuChip`）
 * 役チップ
 *
 * 選択を変えない表示専用のピル。色はその役をどう扱ったか（core の
 * `judgeYakuName`）で決まる。`onPress` を渡すと押せるピルになり、押すと
 * 役一覧のその役を開く（早見表に載る役だけ。web と同じ）。
 */
export function YakuChip({
  label,
  feedbackState,
  onPress,
}: {
  /** 画面に出す表示名 */
  readonly label: string;
  /** その役をどう扱ったか */
  readonly feedbackState: YakuSelectionState;
  /** 押したとき（役一覧をその役で開く）。省略すると押せない */
  readonly onPress?: () => void;
}) {
  const t = useTranslations("challenge");
  const chip = (
    <Text style={[styles.chip, YAKU_SELECTION_STYLES[feedbackState]]}>
      {label}
    </Text>
  );
  if (onPress === undefined) return chip;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityHint={t("openInYakuList")}
      hitSlop={4}
      style={({ pressed }) => pressed && styles.pressed}
    >
      {chip}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.6,
  },
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
