import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  practiceListChapters,
  practiceListRanks,
  type PracticeListFilter,
} from "@mahjong-scoring/features/practice/list-guides";
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
 * 基礎練習の一覧の後ろに「関連するレッスン」と「点数計算 黒帯への道」を並べる。
 * 中身は絞り込みに合わせて変わり、絞り込みが無ければ先頭だけを出す（決め方は
 * features の `practiceListChapters` / `practiceListRanks`）。どちらも末尾に
 * 全体への導線（目次へ / 道場へ）を置く。一覧の上ではなく下に置くのは、基礎練習と
 * 実戦練習を切り替えたときにカードの始まる位置をずらさないため。
 */
export function PracticeListGuides({
  filter,
}: {
  /** 一覧の絞り込み。undefined なら絞り込みなし */
  readonly filter: PracticeListFilter | undefined;
}) {
  const t = useTranslations("practice");
  const goToTab = useGoToTab();
  const ranks = practiceListRanks(filter);

  return (
    <View style={styles.root}>
      <PracticeChapterSection
        title={t("requiredKnowledge")}
        slugs={practiceListChapters(filter)}
      />
      {ranks.length > 0 && (
        <View style={styles.section}>
          <SectionTitle>{t("modes.journeyTitle")}</SectionTitle>
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
    alignItems: "flex-end",
  },
});
