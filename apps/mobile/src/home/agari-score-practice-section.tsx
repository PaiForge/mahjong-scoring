import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";

import { SectionTitle } from "../components/section-title";
import { colors } from "../lib/theme";
import { PracticalPracticeCard } from "../practice/components/practical-practice-card";

/**
 * ホームの「おすすめの練習」（web の `AgariScorePracticeSection`）
 * 和了形の点数計算のすすめ
 *
 * 全級を取得したユーザーには黒帯への道の「次にやること」が無い。ホームが
 * お知らせだけになるのを避けるため、終わりのない和了形の点数計算へ誘導する
 * （未完了のレッスンが残っていれば「レッスンの続き」と並ぶ）。カードは練習一覧の
 * 実戦練習と同じもの。
 */
export function AgariScorePracticeSection() {
  const t = useTranslations("dashboard");

  return (
    <View style={styles.section}>
      <SectionTitle>{t("recommendedPracticeTitle")}</SectionTitle>
      <Text style={styles.hint}>{t("agariScorePracticeHint")}</Text>
      <PracticalPracticeCard menu="agari-score" />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 16,
  },
  hint: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.surface500,
  },
});
