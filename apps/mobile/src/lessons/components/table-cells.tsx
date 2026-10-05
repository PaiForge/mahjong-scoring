import type { ReactNode } from "react";
import { StyleSheet, Text } from "react-native";

import { colors } from "../../lib/theme";

/** 強調する値のセル（web の `font-semibold text-primary-600`） */
export function StrongCell({ children }: { readonly children: ReactNode }) {
  return <Text style={styles.strong}>{children}</Text>;
}

/** 控えめな値のセル（web の `text-surface-400` / `text-surface-500`） */
export function MutedCell({
  children,
  tone = 400,
}: {
  readonly children: ReactNode;
  readonly tone?: 400 | 500;
}) {
  return (
    <Text
      style={[
        styles.text,
        { color: tone === 400 ? colors.surface400 : colors.surface500 },
      ]}
    >
      {children}
    </Text>
  );
}

/** 本文色のセル（web の `text-surface-900` / `font-medium`） */
export function PlainCell({
  children,
  medium = false,
}: {
  readonly children: ReactNode;
  readonly medium?: boolean;
}) {
  return (
    <Text style={[styles.plain, medium && styles.medium]}>{children}</Text>
  );
}

/** 行見出しのセル（web の `DataTableRowHeaderCell` = 淡い面の太字） */
export function RowHeaderCell({ children }: { readonly children: ReactNode }) {
  return <Text style={styles.rowHeader}>{children}</Text>;
}

const styles = StyleSheet.create({
  strong: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary600,
    textAlign: "center",
  },
  text: {
    fontSize: 14,
  },
  plain: {
    fontSize: 14,
    color: colors.surface900,
  },
  medium: {
    fontWeight: "500",
  },
  rowHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface700,
  },
});
