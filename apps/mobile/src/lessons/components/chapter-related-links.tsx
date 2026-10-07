import { StyleSheet, View } from "react-native";
import { useTranslations } from "use-intl";
import {
  getChapterBySlug,
  type CurriculumChapterSlug,
  type PracticeLink,
} from "@mahjong-scoring/features/curriculum/registry";
import { MOBILE_AD_SLOTS } from "@mahjong-scoring/features/ads/native-ad";
import { relatedPracticeLinks } from "@mahjong-scoring/features/lessons/registry";

import { NativeAdCard } from "../../ads/native-ad-card";
import { useNativeAds } from "../../ads/use-native-ads";
import { SectionTitle } from "../../components/section-title";
import { ExamCtaCard } from "../../dojo/exam-cta-card";
import { PracticeCard } from "../../practice/components/practice-card";

/**
 * レッスンの本文の後に出す、練習への導線（web の `ChapterRelatedLinks`）
 * レッスン関連リンク
 *
 * 確認問題を持つレッスンでは完了画面の末尾（と完了済みの人が開いた本文の
 * 下）に、持たないレッスンでは完了ボタンの下に出す。送り先は確認問題を
 * 持つレッスンならレジストリの `practiceLinks`、持たないレッスンなら章の
 * `practiceLinks`。
 *
 * カードは練習一覧と同じ {@link PracticeCard}。試験を持つ章では、その下に
 * 昇級試験の案内（{@link ExamCtaCard}。行き先は試験の説明画面と模試）を置く。
 *
 * 練習のカードの並びの末尾に広告のカードを 1 枚混ぜる（練習一覧と同じカードの
 * 形。web と同じ）。web が出す和了形の点数計算の絞り込み（カタログ外の練習）への
 * ボタンはモバイルに出さない — 和了形の点数計算は URL の絞り込み（`?yaku=` 等）を
 * 受け取らない。練習も試験も無い章（基礎のセクション）では何も出さない。
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
  const examSlug = getChapterBySlug(slug)?.examSlug;
  const [ad] = useNativeAds(MOBILE_AD_SLOTS.lessonPractices);
  if (links.length === 0 && examSlug === undefined) return undefined;

  return (
    <>
      {links.length > 0 && (
        <View style={styles.section}>
          <SectionTitle>{t("practiceTitle")}</SectionTitle>
          <View style={styles.list}>
            {links.map((link) => (
              <PracticeCard
                key={`${link.slug}:${link.variant ?? ""}`}
                slug={link.slug}
                variant={link.variant}
              />
            ))}
            {ad !== undefined && <NativeAdCard creative={ad} />}
          </View>
        </View>
      )}
      {examSlug !== undefined && <ExamCtaCard slug={examSlug} />}
    </>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 16,
  },
  list: {
    gap: 16,
  },
});
