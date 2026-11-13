import { useState } from "react";
import { useRouter } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { MOBILE_AD_SLOTS } from "@mahjong-scoring/features/ads/native-ad";
import { adIndexAfterGroup } from "@mahjong-scoring/features/ads/spacing";
import { KANA_ROWS } from "@mahjong-scoring/features/glossary/kana";
import { filterGlossaryTerms } from "@mahjong-scoring/features/glossary/search";
import {
  GLOSSARY_CATEGORIES,
  type GlossaryCategory,
} from "@mahjong-scoring/features/glossary/types";
import { glossaryTermViews } from "@mahjong-scoring/features/glossary/views";

import { NativeAdRow } from "../../../ads/native-ad-row";
import { useNativeAds } from "../../../ads/use-native-ads";
import { FilterChips } from "../../../components/filter-chips";
import { LinkRow, LinkRowList } from "../../../components/link-row";
import { Screen } from "../../../components/screen";
import { SearchField } from "../../../components/search-field";
import { colors } from "../../../lib/theme";
import { RelatedReferencesSection } from "../../../reference/related-references-section";

/** 分類のチップの「すべて」（分類のキーと重ならない値） */
const ALL_CATEGORIES = "all";

/**
 * 用語集
 *
 * @description
 * 点数計算に出てくる麻雀の専門用語の一覧（web の `/reference/glossary`）。
 * 上に検索欄と分類のチップ、下に五十音順の行の一覧を置き、語の説明は用語の
 * 画面に置く。検索は見出し語・読みに掛かり、分類と重ねて絞り込める
 * （`filterGlossaryTerms`）。
 *
 * web と違うもの: web は「分類から探す」「五十音から探す」に語と行のリンクを
 * 並べる（ページ内リンクの目次）。以前はそれを写していたが、60 語ほどの文字
 * リンクが画面を埋めて web のページに見え、目的の語は結局スクロールして探す
 * ことになる。アプリでは一覧を絞り込む形（検索欄 + チップ）に置き換えた。
 * 五十音の行へ飛ぶ索引は持たない — 絞り込めば一覧が短くなる。
 *
 * 広告は絞り込んでいない一覧にだけ混ぜる（位置は `adIndexAfterGroup`。数えるのは
 * 語のある行だけ。web と同じ）。探している最中の短い結果には挟まない。
 *
 * @flow
 * 点数表・役一覧の「ほかの早見表」か、レッスン本文の用語のシートから来て、
 * 検索か分類で目的の語を探し、用語の画面へ進む。一覧の下の
 * 「ほかの早見表」から点数表・役一覧へ。
 */
export default function GlossaryIndexScreen() {
  const t = useTranslations("glossary");
  const router = useRouter();
  const terms = glossaryTermViews((key) => t(key));
  const ads = useNativeAds(MOBILE_AD_SLOTS.glossaryIndex);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<
    GlossaryCategory | typeof ALL_CATEGORIES
  >(ALL_CATEGORIES);

  const filtering = query.trim() !== "" || category !== ALL_CATEGORIES;
  const shown = filterGlossaryTerms(terms, {
    query,
    category: category === ALL_CATEGORIES ? undefined : category,
  });
  const rows = KANA_ROWS.map((row) => ({
    row,
    terms: shown.filter((term) => term.indexRow === row),
  })).filter(({ terms: inRow }) => inRow.length > 0);

  return (
    <Screen title={t("title")} back contentStyle={styles.content}>
      <View style={styles.filters}>
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder={t("searchPlaceholder")}
          testID="glossary-search"
        />
        <FilterChips
          groups={[
            [{ value: ALL_CATEGORIES, label: t("allCategories") }],
            GLOSSARY_CATEGORIES.map((key) => ({
              value: key,
              // 例: glossary.categories.hai
              label: t(`categories.${key}`),
            })),
          ]}
          selected={category}
          onSelect={setCategory}
          accessibilityLabel={t("categoryIndexTitle")}
        />
      </View>

      {rows.length === 0 ? (
        <Text style={styles.empty}>{t("noSearchResults")}</Text>
      ) : (
        <View style={styles.rows}>
          {rows.map(({ row, terms: inRow }, rowIndex) => {
            const adIndex = filtering ? undefined : adIndexAfterGroup(rowIndex);
            const ad = adIndex === undefined ? undefined : ads[adIndex];
            return (
              <View key={row} style={styles.kanaRow}>
                <Text accessibilityRole="header" style={styles.heading}>
                  {t("kanaRowHeading", { row })}
                </Text>
                <LinkRowList>
                  {inRow.map((term) => (
                    <LinkRow
                      key={term.slug}
                      onPress={() => router.push(term.href)}
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
      )}

      <RelatedReferencesSection current="glossary" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 32,
  },
  filters: {
    gap: 12,
  },
  rows: {
    gap: 24,
  },
  heading: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.surface900,
  },
  kanaRow: {
    gap: 8,
  },
  empty: {
    fontSize: 15,
    lineHeight: 24,
    color: colors.surface500,
  },
});
