import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import {
  practiceMenuFromCatalog,
  practiceTitleKey,
  relatedChaptersForPractice,
} from "@mahjong-scoring/features/practice/catalog";
import { practiceCardVisual } from "@mahjong-scoring/features/practice/card-visual";
import type { PracticeMenuSlug } from "@mahjong-scoring/features/practice-menu-types";
import {
  chapterHref,
  practiceHref,
  rankHref,
} from "@mahjong-scoring/features/routes";

import { BeltPill } from "../../components/belt-pill";
import { BookIcon, ChevronRightIcon } from "../../components/icons/icons";
import { colors, radius } from "../../lib/theme";
import { PracticeCardVisual } from "./practice-card-visual";

/**
 * 練習一覧のカード（web の `CatalogPracticeCard`）
 *
 * 練習名・レッスンへのアイコン・身につく段級位・例示の帯・「くわしく見る」。カードは
 * 説明画面へ移動するだけで練習は始まらないので、影を持たせない（web と同じ細枠）。
 *
 * レッスンのアイコンと段級位のピルはカードの中の別の行き先（その練習を最初に扱う
 * レッスン / その級の詳細）で、押すとカードではなくそちらへ移動する（web と同じ）。
 */
export function PracticeCard({ slug }: { readonly slug: PracticeMenuSlug }) {
  const t = useTranslations("practice");
  const tRanks = useTranslations("ranks");
  const router = useRouter();
  const rank = practiceMenuFromCatalog(slug)?.rank;
  const firstChapter = relatedChaptersForPractice(slug)[0];
  const visual = practiceCardVisual(slug, (key) => t(key));

  return (
    <Pressable
      onPress={() => router.push(practiceHref(slug))}
      accessibilityRole="link"
      testID={`practice-card-${slug}`}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>{t(practiceTitleKey(slug))}</Text>
        {/* アイコンとピルはどちらも押せるので、押し間違えない間隔（12px）を取る（web と同じ） */}
        <View style={styles.headerLinks}>
          {firstChapter !== undefined && (
            <Pressable
              onPress={() => router.push(chapterHref(firstChapter))}
              accessibilityRole="link"
              accessibilityLabel={t("learn")}
              hitSlop={6}
              style={({ pressed }) => [
                styles.learn,
                pressed && styles.learnPressed,
              ]}
            >
              <BookIcon size={16} color={colors.surface400} />
            </Pressable>
          )}
          {rank !== undefined && (
            <BeltPill
              slug={rank}
              label={tRanks(`names.${rank}`)}
              onPress={() => router.push(rankHref(rank))}
              accessibilityLabel={tRanks("pillLinkLabel", {
                rank: tRanks(`names.${rank}`),
              })}
            />
          )}
        </View>
      </View>
      {visual !== undefined && <PracticeCardVisual visual={visual} />}
      <View style={styles.footer}>
        <Text style={styles.detail}>{t("detail")}</Text>
        <ChevronRightIcon size={16} color={colors.primary700} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: colors.panel,
    borderRadius: radius.panel,
    backgroundColor: colors.white,
    padding: 20,
    gap: 16,
  },
  pressed: {
    backgroundColor: colors.surface50,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
  },
  headerLinks: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  learn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.panel,
  },
  learnPressed: {
    backgroundColor: colors.surface100,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: "700",
    color: colors.surface900,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  detail: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.primary700,
  },
});
