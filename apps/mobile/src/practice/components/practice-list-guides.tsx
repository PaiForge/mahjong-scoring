import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import type { CurriculumChapterSlug } from "@mahjong-scoring/features/curriculum/registry";
import type { RankSlug } from "@mahjong-scoring/features/ranks/registry";
import { DOJO_PATH } from "@mahjong-scoring/features/routes";

import { SectionTitle } from "../../components/section-title";
import { TextLink } from "../../components/text-link";
import { RankSummaryCard } from "../../dojo/rank-summary-card";
import { useGoToTab } from "../../hooks/use-go-to-tab";
import { PracticeChapterSection } from "./practice-chapter-section";

/**
 * 練習一覧の下に置くレッスンと段級位（web の `PracticeListGuides`）
 * 一覧のガイド
 *
 * 基礎練習・実戦練習のカードの後ろに「関連するレッスン」と「関連する段級位」を
 * 並べる。中身は呼び出し側が features の `list-guides` で決める（基礎練習は
 * 絞り込みに合わせて変わる）。どちらも末尾の中央に
 * 全体への導線（目次へ / 道場へ）を置く。一覧の上ではなく下に置くのは、基礎練習と
 * 実戦練習を切り替えたときにカードの始まる位置をずらさないため。
 */
export function PracticeListGuides({
  chapters,
  ranks,
}: {
  /** 並べるレッスン（カリキュラムの順）。0 件なら節ごと出さない */
  readonly chapters: readonly CurriculumChapterSlug[];
  /** 並べる段級位（学習順）。0 件なら節ごと出さない */
  readonly ranks: readonly RankSlug[];
}) {
  const t = useTranslations("practice");
  const goToTab = useGoToTab();

  return (
    <View style={styles.root}>
      <PracticeChapterSection
        title={t("requiredKnowledge")}
        slugs={chapters}
        tocLinkAlign="center"
      />
      {ranks.length > 0 && (
        <View style={styles.section}>
          <SectionTitle>{t("relatedRanks")}</SectionTitle>
          <View style={styles.ranks}>
            {ranks.map((rank) => (
              <RankSummaryCard key={rank} rankSlug={rank} />
            ))}
          </View>
          <View style={styles.link}>
            <TextLink onPress={() => goToTab(DOJO_PATH)}>
              {t("modes.dojoLink")}
            </TextLink>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 32,
  },
  section: {
    gap: 12,
  },
  ranks: {
    gap: 16,
  },
  link: {
    alignItems: "center",
  },
});
