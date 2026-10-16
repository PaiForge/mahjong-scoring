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
import { useExamGoalCount } from "./use-exam-goal-count";

/**
 * 昇級試験の合格条件セクション（web の `ExamConditions`）
 * 合格条件表示
 *
 * 説明画面の開始ボタンの直前に置き、通常のチャレンジとのルール差（ミス1回で
 * 終了・合格ライン）を伝える。数値はレジストリ（練習: 制限時間・ミス上限 /
 * ランク: 合格点）が正典。合格点だけはサーバーの値を優先する
 * （`useExamGoalCount`）。開始後の終了と合否はサーバーの合格ラインで決まる
 * ので、手元の値を出すと、サーバーが合格ラインを変えたときに案内した条件を
 * 満たしても不合格になる。見出しに級名を入れて縦線に帯色を着せ、どの級の試験かを
 * ここで確定させる。
 *
 * モバイルで受けられるのは模試だけだが、模試は本番と同じ出題なので、
 * 本番で何が求められるかとしてそのまま示す。
 */
export function ExamConditions({ slug }: { readonly slug: PracticeMenuSlug }) {
  const t = useTranslations("ranks");
  const menu = practiceMenuBySlug(slug);
  const exam = rankRequiringMenu(menu.menuType);
  const minScore = useExamGoalCount(
    menu.menuType,
    exam?.requirement.minScore ?? 0,
  );
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
            minScore,
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
