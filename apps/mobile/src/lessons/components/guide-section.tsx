import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { SectionTitle } from "../../components/section-title";

/**
 * 教本本文の節（見出し + 本文）（web の `GuideSection`）
 * 教本節
 */
export function GuideSection({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <SectionTitle>{title}</SectionTitle>
      {children}
    </View>
  );
}

/**
 * 章本文の外枠（web の `space-y-10` の `<div>`）
 * 章本文
 *
 * 節どうしの間隔を揃える。
 */
export function GuideBody({ children }: { readonly children: ReactNode }) {
  return <View style={styles.body}>{children}</View>;
}

/** 節の中のまとまり（web の `space-y-3` / `space-y-4` の `<section>`） */
export function GuideStack({
  children,
  gap = 12,
}: {
  readonly children: ReactNode;
  readonly gap?: number;
}) {
  return <View style={{ gap }}>{children}</View>;
}

const styles = StyleSheet.create({
  section: {
    gap: 16,
  },
  body: {
    gap: 40,
  },
});
