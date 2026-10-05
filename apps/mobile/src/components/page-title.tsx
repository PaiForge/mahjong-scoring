import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "../lib/theme";

interface PageTitleProps {
  readonly children: ReactNode;
  /** 見出しの右に添える操作（ヘルプの「?」等） */
  readonly action?: ReactNode;
}

/** 画面の見出し（web の `PageTitle` = 中央寄せの濃い緑の太字） */
export function PageTitle({ children, action }: PageTitleProps) {
  return (
    <View style={styles.row}>
      <Text accessibilityRole="header" style={styles.title}>
        {children}
      </Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.primary900,
    textAlign: "center",
  },
});
