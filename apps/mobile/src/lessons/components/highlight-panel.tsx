import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Chip } from "../../components/chip";
import { borderWidth, colors, radius } from "../../lib/theme";
import { lessonColors } from "../lesson-colors";

/**
 * 目を引かせる囲み（web の `HighlightPanel` = 琥珀色の細い枠と淡い面）
 * 強調パネル
 *
 * 教本のコラム・計算手順など「本筋の隣に置く箱」。
 */
export function HighlightPanel({ children }: { readonly children: ReactNode }) {
  return <View style={styles.panel}>{children}</View>;
}

/**
 * 教本のコラム（web の `GuideColumn`）
 * 教本コラム
 *
 * 琥珀色の囲みに、分類ラベルのチップと見出しを載せた形。
 */
export function GuideColumn({
  label,
  title,
  children,
}: {
  readonly label: string;
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <HighlightPanel>
      <View style={styles.labelRow}>
        <Chip tone="amber">{label}</Chip>
      </View>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <View style={styles.body}>{children}</View>
    </HighlightPanel>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: borderWidth.panel,
    borderColor: colors.amber300,
    borderRadius: radius.panel,
    backgroundColor: lessonColors.amber50,
    padding: 20,
  },
  labelRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  title: {
    marginBottom: 8,
    fontSize: 14,
    fontWeight: "600",
    color: colors.surface900,
  },
  body: {
    gap: 8,
  },
});
