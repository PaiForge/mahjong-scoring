import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";

import { panelFrame } from "../../lib/panel-styles";
import { colors } from "../../lib/theme";

/**
 * 完了画面の続きを入れる枠（「次のレッスン」「昇級試験まで」）
 * 続きの枠
 *
 * 細枠に表の見出し行と同じ淡い緑の帯を載せる（web の `NextLessonPreview` /
 * `RankGoalPanel` と同じ体裁）。節の見出し（`SectionTitle`）にすると
 * 「できるようになったこと」との区切りが強すぎ、完了の続きではなく別の
 * 話題に見える。同じ位置に出るものが同じ形をしているよう、2 つで共有する。
 */
export function FollowUpPanel({
  title,
  testID,
  children,
}: {
  readonly title: string;
  readonly testID?: string;
  readonly children: ReactNode;
}) {
  return (
    <View style={styles.frame} testID={testID}>
      <Text accessibilityRole="header" style={styles.title}>
        {title}
      </Text>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: panelFrame,
  title: {
    borderBottomWidth: 1,
    borderBottomColor: colors.panel,
    backgroundColor: colors.primary50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: "700",
    color: colors.surface700,
  },
  body: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
});
