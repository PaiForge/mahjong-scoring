import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { colors } from "../lib/theme";
import { DashedDivider } from "./dashed-divider";
import { ChevronRightIcon } from "./icons/icons";

interface LinkRowProps {
  readonly onPress: () => void;
  readonly title: string;
  readonly description?: string;
  readonly leading?: ReactNode;
  readonly trailing?: ReactNode;
}

/**
 * 読む・見るためのリンク 1 行（web の `LinkRow`）
 *
 * 太枠 + ハードシャドウは「押して始める面」の記号なので、見に行くだけの導線は
 * カードにせずこれを使う。タイトルはグレーの下線（web の `ROW_LINK_TITLE_CLASSES`）。
 */
export function LinkRow({
  onPress,
  title,
  description,
  leading,
  trailing,
}: LinkRowProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {leading !== undefined && <View style={styles.side}>{leading}</View>}
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        {description !== undefined && (
          <Text style={styles.description}>{description}</Text>
        )}
      </View>
      <View style={styles.side}>
        {trailing ?? <ChevronRightIcon size={16} color={colors.surface400} />}
      </View>
    </Pressable>
  );
}

/** {@link LinkRow} を並べる枠。行の間を破線で区切る */
export function LinkRowList({ children }: { readonly children: ReactNode }) {
  const items = Array.isArray(children) ? children.flat() : [children];
  const rows = items.filter(Boolean);
  return (
    <View>
      {rows.map((child, i) => (
        <View key={i}>
          {child}
          {i < rows.length - 1 && <DashedDivider />}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: -8,
    borderRadius: 14,
  },
  pressed: {
    backgroundColor: colors.surface50,
  },
  side: {
    minHeight: 20,
    justifyContent: "center",
  },
  body: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.mutedForeground,
    textDecorationLine: "underline",
    textDecorationColor: colors.surface300,
  },
  description: {
    marginTop: 2,
    fontSize: 12,
    color: colors.surface400,
  },
});
