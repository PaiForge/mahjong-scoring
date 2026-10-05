import { StyleSheet, Text, View } from "react-native";
import type { RankSlug } from "@mahjong-scoring/features/ranks/registry";

import { radius } from "../lib/theme";
import { beltStyle } from "./belt-style";

/**
 * 帯色の節見出し（web の `SectionTitle` に `toneClass` で帯色を着せたもの）
 * 帯色見出し
 *
 * 特定の段級位のものである節（試験の合格条件・昇級試験の案内）だけが使う。
 * 既定の緑のままだと、隣の帯色の枠と競合して緑がその級の色に見えるため。
 */
export function BeltSectionTitle({
  slug,
  children,
}: {
  readonly slug: RankSlug;
  readonly children: string;
}) {
  const belt = beltStyle(slug);
  return (
    <View style={styles.row}>
      <Text
        accessibilityRole="header"
        style={[
          styles.pill,
          { backgroundColor: belt.fill, color: belt.foreground },
        ]}
      >
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
  },
  pill: {
    borderRadius: radius.full,
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingVertical: 6,
    fontSize: 16,
    fontWeight: "700",
  },
});
