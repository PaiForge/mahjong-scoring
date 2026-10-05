import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { linkStyles } from "../lib/link-styles";
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
 * カードにせずこれを使う。押せることは行の形（右端の矢印と押したときの地の色）
 * で示し、題名は地の文と同じ濃さにする（`linkStyles.rowTitle`）。
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
        <Text style={[styles.title, linkStyles.rowTitle]}>{title}</Text>
        {description !== undefined && (
          <Text style={styles.description}>{description}</Text>
        )}
      </View>
      <View style={styles.side}>
        {trailing ?? <ChevronRightIcon size={18} color={colors.surface400} />}
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
    fontSize: 15,
  },
  description: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    color: colors.surface500,
  },
});
