import { useRef } from "react";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  MOBILE_AD_SLOTS,
  type NativeAdView,
} from "@mahjong-scoring/features/ads/native-ad";
import { adIndexAfterGroup } from "@mahjong-scoring/features/ads/spacing";
import {
  KANA_ROWS,
  type KanaRow,
} from "@mahjong-scoring/features/glossary/kana";
import { GLOSSARY_CATEGORIES } from "@mahjong-scoring/features/glossary/types";
import { glossaryTermViews } from "@mahjong-scoring/features/glossary/views";

import { NativeAdRow } from "../../../ads/native-ad-row";
import { useNativeAds } from "../../../ads/use-native-ads";
import { LinkRow, LinkRowList } from "../../../components/link-row";
import { Screen } from "../../../components/screen";
import { useScrollIntoView } from "../../../components/scroll-into-view";
import { SectionTitle } from "../../../components/section-title";
import { linkStyles } from "../../../lib/link-styles";
import { colors } from "../../../lib/theme";
import { TermLinkList } from "../../../reference/term-link-list";

/**
 * 用語集
 *
 * @description
 * 点数計算に出てくる麻雀の専門用語の一覧（web の `/reference/glossary`）。
 * 分類（意味の近さ）と五十音の 2 つの入口を持ち、語の説明は用語の画面に置く。
 *
 * @flow
 * 早見表のハブか、レッスン本文の用語のシートから来て、分類か五十音で目的の
 * 語を探し、用語の画面へ進む。
 */
export default function GlossaryIndexScreen() {
  const t = useTranslations("glossary");
  const router = useRouter();
  const terms = glossaryTermViews((key) => t(key));
  const ads = useNativeAds(MOBILE_AD_SLOTS.glossaryIndex);

  return (
    <Screen title={t("title")} back contentStyle={styles.content}>
      <View style={styles.section}>
        <SectionTitle>{t("categoryIndexTitle")}</SectionTitle>
        {GLOSSARY_CATEGORIES.map((category) => {
          const inCategory = terms.filter((term) => term.category === category);
          if (inCategory.length === 0) return undefined;
          return (
            <View key={category} style={styles.category}>
              <Text style={styles.heading}>{t(`categories.${category}`)}</Text>
              <TermLinkList terms={inCategory} />
            </View>
          );
        })}
      </View>

      <KanaIndex
        title={t("kanaIndexTitle")}
        rows={KANA_ROWS.map((row) => ({
          row,
          label: t("kanaRowHeading", { row }),
          terms: terms.filter((term) => term.kanaRow === row),
        }))}
        onOpen={(href) => router.push(href)}
        ads={ads}
      />
    </Screen>
  );
}

/**
 * 五十音の入口（行へのジャンプ + 行ごとの一覧）
 *
 * 収録語が無い行はジャンプを押せない薄い文字のまま置き、一覧には出さない。
 * 行が抜けると「わ行は無いのか、飛ばされたのか」が分からなくなるため、
 * ジャンプの並びは常にあ行から わ行まで固定で見せる（web と同じ）。
 *
 * 広告は行の一覧の末尾に 1 行ずつ、間隔を広げながら置く（位置は
 * `adIndexAfterGroup`。数えるのは語のある行だけ。web と同じ）。
 */
function KanaIndex({
  title,
  rows,
  onOpen,
  ads,
}: {
  readonly title: string;
  readonly rows: readonly {
    readonly row: KanaRow;
    readonly label: string;
    readonly terms: ReturnType<typeof glossaryTermViews>;
  }[];
  readonly onOpen: (href: string) => void;
  /** 一覧に混ぜる広告（並び順どおり、スロットの枠数まで） */
  readonly ads: readonly NativeAdView[];
}) {
  const scrollIntoView = useScrollIntoView();
  const headingRefs = useRef(new Map<KanaRow, View | null>());

  return (
    <View style={styles.section}>
      <SectionTitle>{title}</SectionTitle>
      <View style={styles.kanaNav}>
        {rows.map(({ row, label, terms }) =>
          terms.length === 0 ? (
            <Text key={row} style={[styles.kana, styles.kanaEmpty]}>
              {label}
            </Text>
          ) : (
            <Pressable
              key={row}
              onPress={() =>
                scrollIntoView(headingRefs.current.get(row) ?? null)
              }
              accessibilityRole="link"
              hitSlop={6}
            >
              {({ pressed }) => (
                <Text
                  style={[
                    styles.kana,
                    linkStyles.textButton,
                    pressed && linkStyles.textButtonPressed,
                  ]}
                >
                  {label}
                </Text>
              )}
            </Pressable>
          ),
        )}
      </View>
      {rows
        .filter(({ terms }) => terms.length > 0)
        .map(({ row, label, terms }, rowIndex) => {
          const adIndex = adIndexAfterGroup(rowIndex);
          const ad = adIndex === undefined ? undefined : ads[adIndex];
          return (
            <View key={row} style={styles.kanaRow}>
              <View
                ref={(node) => {
                  headingRefs.current.set(row, node);
                }}
                collapsable={false}
              >
                <Text style={styles.heading}>{label}</Text>
              </View>
              <LinkRowList>
                {terms.map((term) => (
                  <LinkRow
                    key={term.slug}
                    onPress={() => onOpen(term.href)}
                    title={term.term}
                    description={term.reading}
                  />
                ))}
                {ad !== undefined && <NativeAdRow creative={ad} />}
              </LinkRowList>
            </View>
          );
        })}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 40,
  },
  section: {
    gap: 16,
  },
  category: {
    gap: 8,
  },
  heading: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.surface900,
  },
  kanaNav: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 16,
    rowGap: 8,
  },
  kana: {
    fontSize: 15,
  },
  kanaEmpty: {
    color: colors.surface300,
  },
  kanaRow: {
    gap: 8,
  },
});
