import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@mahjong-scoring/features/practice-menu-types";
import { rankRequiringMenu } from "@mahjong-scoring/features/ranks/registry";

import { SectionTitle } from "../../components/section-title";
import { beltStyle } from "../../dojo/belt-style";
import { HighlightPanel } from "../../lessons/components/highlight-panel";
import { colors } from "../../lib/theme";

/**
 * 昇級試験の合格条件セクション（web の `ExamConditions`）
 * 合格条件表示
 *
 * 説明画面の開始ボタンの直前に置き、通常のチャレンジとのルール差（ミス1回で
 * 終了・合格ライン）を伝える。数値はレジストリ（練習: 制限時間・ミス上限 /
 * ランク: 合格点）が正典。見出しに級名を入れて縦線に帯色を着せ、どの級の試験かを
 * ここで確定させる。
 *
 * モバイルで受けられるのは模試だけだが、模試は本番と同じ出題なので、
 * 本番で何が求められるかとしてそのまま示す。
 */
export function ExamConditions({ slug }: { readonly slug: PracticeMenuSlug }) {
  const t = useTranslations("ranks");
  const menu = practiceMenuBySlug(slug);
  const exam = rankRequiringMenu(menu.menuType);
  if (!exam) return undefined;

  return (
    <View style={styles.section}>
      <SectionTitle accentColor={beltStyle(exam.rank.slug).fill}>
        {t("rankPassConditionsTitle", { rank: t(`names.${exam.rank.slug}`) })}
      </SectionTitle>
      <HighlightPanel>
        <Text style={styles.text}>
          {t("passConditions", {
            timeLimit: menu.timeLimit,
            minScore: exam.requirement.minScore,
            mistakeLimit: menu.mistakeLimit,
          })}
        </Text>
      </HighlightPanel>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  text: {
    fontSize: 14,
    lineHeight: 22,
    color: colors.surface700,
  },
});
