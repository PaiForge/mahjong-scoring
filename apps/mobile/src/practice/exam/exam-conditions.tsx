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
import { TextLink } from "../../components/text-link";
import { colors, radius } from "../../lib/theme";
import { useExamGoal } from "./use-exam-goal";

/**
 * 昇級試験の合格条件セクション（web の `ExamConditions`）
 * 合格条件表示
 *
 * 説明画面の開始ボタンの直前に置き、通常のチャレンジとのルール差（ミス1回で
 * 終了・合格ライン）を伝える。数値はレジストリ（練習: 制限時間・ミス上限 /
 * ランク: 合格点）が正典。合格点だけはサーバーの値を出す（`useExamGoal`）。
 * 開始後の終了と合否はサーバーの合格ラインで決まるので、手元の値を出すと、
 * サーバーが合格ラインを変えたときに案内した条件を満たしても不合格になる。
 * まだ 1 度も読めていない間は文の代わりに灰色の帯を置き、読めなければ
 * 条件を出さずに読み直しの操作を出す（本番の開始ボタンも押せないまま）。見出しに級名を入れて縦線に帯色を着せ、どの級の試験かを
 * ここで確定させる。
 *
 * モバイルで受けられるのは模試だけだが、模試は本番と同じ出題なので、
 * 本番で何が求められるかとしてそのまま示す。
 */
export function ExamConditions({ slug }: { readonly slug: PracticeMenuSlug }) {
  const t = useTranslations("ranks");
  const menu = practiceMenuBySlug(slug);
  const exam = rankRequiringMenu(menu.menuType);
  const { goal, retry } = useExamGoal(menu.menuType);
  if (!exam) return undefined;
  const minScore = goal.status === "failed" ? undefined : goal.goal;

  return (
    <View style={styles.section}>
      <SectionTitle accentColor={beltStyle(exam.rank.slug).fill}>
        {t("rankPassConditionsTitle", { rank: t(`names.${exam.rank.slug}`) })}
      </SectionTitle>
      <HighlightPanel>
        {goal.status === "failed" ? (
          <View style={styles.failed}>
            <Text style={styles.text}>{t("goalLoadFailed")}</Text>
            <TextLink onPress={retry} testID="exam-goal-retry">
              {t("goalRetry")}
            </TextLink>
          </View>
        ) : minScore === undefined ? (
          <View
            style={styles.placeholder}
            accessible
            accessibilityLabel={t("goalLoading")}
            testID="exam-goal-loading"
          />
        ) : (
          <Text style={styles.text}>
            {t("passConditions", {
              timeLimit: menu.timeLimit,
              minScore,
              mistakeLimit: menu.mistakeLimit,
            })}
          </Text>
        )}
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
  failed: {
    alignItems: "flex-start",
    gap: 4,
  },
  // 文 1 行ぶんの高さ（`text` の lineHeight）を取り、読めた文に替わっても下が動かない
  placeholder: {
    height: 22,
    borderRadius: radius.md,
    backgroundColor: colors.surface200,
  },
});
