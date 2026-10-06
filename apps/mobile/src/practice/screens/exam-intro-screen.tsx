import { StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import {
  practiceMenuBySlug,
  type PracticeMenuSlug,
} from "@mahjong-scoring/features/practice-menu-types";
import { rankRequiringMenu } from "@mahjong-scoring/features/ranks/registry";
import { practiceTrainingHref } from "@mahjong-scoring/features/routes";

import { Button, buttonForeground } from "../../components/button";
import { InfinityIcon } from "../../components/icons/icons";
import { LinkRow, LinkRowList } from "../../components/link-row";
import { Screen } from "../../components/screen";
import { SectionTitle } from "../../components/section-title";
import { ChapterTocList, CurriculumTocLink } from "../../dojo/chapter-toc-list";
import { practiceListHrefForRank } from "../../dojo/dojo-routes";
import { colors, radius } from "../../lib/theme";
import { ExamConditions } from "../exam/exam-conditions";
import type { PracticeScreens } from "../practice-screens";

/** 前提のレッスンに完了の印を出さない（web の練習側の章の並びと同じ） */
const NO_COMPLETED_SLUGS: ReadonlySet<string> = new Set();

/**
 * 昇級試験の説明画面
 *
 * @description
 * web の試験の説明ページ（`PracticeIntroContent` の試験の分岐）と同じ並び:
 * 問題方式（見本の盤面）→ 合格条件 → 開始導線 → 前提となるレッスン →
 * その級の練習メニュー。
 *
 * 開始導線は模試だけ。web は本番の試験（合否判定・段級位の付与）と模試を
 * 並べ、未ログインには本番の代わりに登録の案内を出すが、モバイルはまだ
 * ログインも登録も持たないので、本番の導線そのものを出さない。模試は記録も
 * 段級位の付与も無いので誰でも受けられる。
 */
export function ExamIntroScreen({
  slug,
  screens,
}: {
  readonly slug: PracticeMenuSlug;
  readonly screens: PracticeScreens;
}) {
  const { namespace, menuType } = practiceMenuBySlug(slug);
  const t = useTranslations(namespace);
  const tDojo = useTranslations("dojo");
  const tRanks = useTranslations("ranks");
  const tExam = useTranslations("examTraining");
  const router = useRouter();
  const rank = rankRequiringMenu(menuType)?.rank;
  const { Demo } = screens;

  return (
    <Screen title={t("title")} back contentStyle={styles.content}>
      {Demo === undefined ? (
        <Text style={styles.description}>{t("description")}</Text>
      ) : (
        <View style={styles.howToPlay}>
          <SectionTitle>{t("howToPlay.title")}</SectionTitle>
          <Text style={styles.lead}>{t("howToPlay.lead")}</Text>
          <View
            style={styles.demo}
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            <Demo />
          </View>
        </View>
      )}

      <ExamConditions slug={slug} />

      <View style={styles.start}>
        <Button
          size="lg"
          fullWidth
          icon={<InfinityIcon size={16} color={buttonForeground("primary")} />}
          onPress={() => router.push(practiceTrainingHref(slug))}
          testID="start-training"
        >
          {tExam("startButton")}
        </Button>
        <Text style={styles.hint}>{tExam("hint")}</Text>
      </View>

      {rank !== undefined && rank.learnChapterSlugs.length > 0 && (
        <View style={styles.chapters}>
          <SectionTitle>{tDojo("chaptersTitle")}</SectionTitle>
          <ChapterTocList
            slugs={rank.learnChapterSlugs}
            completedSlugs={NO_COMPLETED_SLUGS}
          />
          <CurriculumTocLink />
        </View>
      )}

      {/* 前提のレッスンの下に「その級の練習」への行リンク。模試で間違えた人が
          次に行く先は、同じ範囲を数える練習でもある */}
      {rank !== undefined && (
        <LinkRowList>
          <LinkRow
            onPress={() => router.navigate(practiceListHrefForRank(rank.slug))}
            leading={<Text style={styles.emoji}>✏️</Text>}
            title={tRanks("practiceLink.title", {
              rank: tRanks(`names.${rank.slug}`),
            })}
            description={tRanks("practiceLink.description")}
          />
        </LinkRowList>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 32,
  },
  description: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.surface500,
  },
  howToPlay: {
    gap: 12,
  },
  lead: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.surface900,
  },
  demo: {
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: radius["2xl"],
    backgroundColor: colors.surface50,
    padding: 16,
  },
  start: {
    alignItems: "center",
    gap: 6,
  },
  hint: {
    fontSize: 12,
    color: colors.surface400,
    textAlign: "center",
  },
  chapters: {
    gap: 12,
  },
  emoji: {
    fontSize: 16,
  },
});
