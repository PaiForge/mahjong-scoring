import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";

import { TextLink } from "../../components/text-link";

/**
 * 無限訓練の盤面の下端の操作（web の `PracticeFooterActions`）
 * 訓練フッター操作
 *
 * トレーニングと同じく、カウンタの下に「わからない」→「終了する」の順で
 * 縦に並べる。回答・開示の後も「わからない」は消さずに薄くして残す —
 * 「終了する」の位置を動かさないため。
 */
export function EndlessFooterActions({
  onReveal,
  revealDisabled,
  onExit,
}: {
  readonly onReveal: () => void;
  readonly revealDisabled: boolean;
  readonly onExit: () => void;
}) {
  const tt = useTranslations("training");
  return (
    <View style={styles.actions}>
      <View
        style={revealDisabled && styles.disabled}
        pointerEvents={revealDisabled ? "none" : "auto"}
        accessibilityElementsHidden={revealDisabled}
      >
        <TextLink onPress={onReveal}>{tt("revealButton")}</TextLink>
      </View>
      <TextLink onPress={onExit}>{tt("exitButton")}</TextLink>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    alignItems: "center",
    gap: 20,
  },
  disabled: {
    opacity: 0.5,
  },
});
