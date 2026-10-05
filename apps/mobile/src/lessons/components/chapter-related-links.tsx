import { Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import {
  type CurriculumChapterSlug,
  type PracticeLink,
} from "@mahjong-scoring/features/curriculum/registry";
import { relatedPracticeLinks } from "@mahjong-scoring/features/lessons/registry";
import {
  practiceMenuFromCatalog,
  practiceTitleKey,
} from "@mahjong-scoring/features/practice/catalog";
import { practiceVariantLabel } from "@mahjong-scoring/features/practice/practice-variant-label";
import { practiceHref } from "@mahjong-scoring/features/routes";

import { BeltPill } from "../../components/belt-pill";
import { ChevronRightIcon } from "../../components/icons/icons";
import { SectionTitle } from "../../components/section-title";
import { colors, radius } from "../../lib/theme";

/**
 * 関連する練習のカード 1 枚（web の `CatalogPracticeCard` をレッスンから使う形）
 * 関連練習カード
 *
 * 練習名・身につく段級位・「くわしく見る」。バリアントを指定したリンクは
 * 行き先に `?variant=` を載せ、練習名にバリアント名を添える
 * （「点数表早引き（子・満貫以上）」）。カードは説明画面へ移動するだけなので
 * 影を持たせない（web も影なしの太枠）。
 */
function RelatedPracticeCard({ link }: { readonly link: PracticeLink }) {
  const t = useTranslations("practice");
  const tRanks = useTranslations("ranks");
  const tAll = useTranslations();
  const router = useRouter();
  const rank = practiceMenuFromCatalog(link.slug)?.rank;
  const title = t(practiceTitleKey(link.slug));
  const variantLabel = practiceVariantLabel(tAll, link.slug, link.variant);

  return (
    <Pressable
      onPress={() => router.push(practiceHref(link.slug, link.variant))}
      accessibilityRole="link"
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>
          {variantLabel ? `${title}（${variantLabel}）` : title}
        </Text>
        {rank !== undefined && (
          <BeltPill slug={rank} label={tRanks(`names.${rank}`)} />
        )}
      </View>
      <View style={styles.footer}>
        <Text style={styles.detail}>{t("detail")}</Text>
        <ChevronRightIcon size={16} color={colors.mutedForeground} />
      </View>
    </Pressable>
  );
}

/**
 * レッスンの本文の後に出す、練習への導線（web の `ChapterRelatedLinks`）
 * レッスン関連リンク
 *
 * 確認問題を持つレッスンでは完了画面の末尾（と完了済みの人が開いた本文の
 * 下）に、持たないレッスンでは完了ボタンの下に出す。送り先は確認問題を
 * 持つレッスンならレジストリの `practiceLinks`、持たないレッスンなら章の
 * `practiceLinks`。
 *
 * web がこの下に出す昇級試験の案内と、総合演習の絞り込み（カタログ外の
 * 練習）へのボタン・広告はモバイルに出さない — モバイルには記録も段級位も
 * 無く、総合演習は URL の絞り込み（`?yaku=` 等）を受け取らない。練習も無い章
 * （基礎のセクション）では何も出さない。
 *
 * @param slug レッスン（章）の slug
 * @param exclude 完了画面の次の一歩と同じ練習（重ねて出さない）
 */
export function ChapterRelatedLinks({
  slug,
  exclude,
}: {
  readonly slug: CurriculumChapterSlug;
  readonly exclude?: PracticeLink;
}) {
  const t = useTranslations("lessons.related");
  const links = relatedPracticeLinks(slug).filter(
    (link) =>
      exclude === undefined ||
      link.slug !== exclude.slug ||
      link.variant !== exclude.variant,
  );
  if (links.length === 0) return undefined;

  return (
    <View style={styles.section}>
      <SectionTitle>{t("practiceTitle")}</SectionTitle>
      <View style={styles.list}>
        {links.map((link) => (
          <RelatedPracticeCard
            key={`${link.slug}:${link.variant ?? ""}`}
            link={link}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 16,
  },
  list: {
    gap: 16,
  },
  card: {
    borderWidth: 3,
    borderColor: colors.ink,
    borderRadius: radius["2xl"],
    backgroundColor: colors.white,
    padding: 20,
    gap: 16,
  },
  pressed: {
    backgroundColor: colors.primary50,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 8,
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
    fontWeight: "700",
    color: colors.mutedForeground,
    textDecorationLine: "underline",
    textDecorationColor: colors.surface300,
  },
});
