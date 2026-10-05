import { StyleSheet, Text, View } from "react-native";

import { colors, radius } from "../lib/theme";

/** 節の見出し（web の `SectionTitle` = 濃い緑の pill に白抜き） */
export function SectionTitle({ children }: { readonly children: string }) {
  return (
    <View style={styles.row}>
      <Text accessibilityRole="header" style={styles.pill}>
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
    backgroundColor: colors.primary700,
    color: colors.white,
    borderRadius: radius.full,
    overflow: "hidden",
    paddingHorizontal: 20,
    paddingVertical: 6,
    fontSize: 16,
    fontWeight: "700",
  },
});
