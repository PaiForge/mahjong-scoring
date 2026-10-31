import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslations } from "use-intl";
import {
  getChapterBySlug,
  type CurriculumChapterSlug,
  type PracticeLink,
} from "@mahjong-scoring/features/curriculum/registry";
import { MOBILE_AD_SLOTS } from "@mahjong-scoring/features/ads/native-ad";
import { relatedPracticeLinks } from "@mahjong-scoring/features/lessons/registry";
import { LESSON_SCORE_PRACTICES } from "@mahjong-scoring/features/practice/score/lesson-practices";
import { AGARI_SCORE_PRACTICE_HREF } from "@mahjong-scoring/features/routes";

import { NativeAdCard } from "../../ads/native-ad-card";
import { useNativeAds } from "../../ads/use-native-ads";
import { Button } from "../../components/button";
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
 * 形。web と同じ）。点数計算の章は、その下に章の内容そのままの出題（七対子だけ等。
 * `LESSON_SCORE_PRACTICES`）で和了形の点数計算を始めるボタンを足す。盤面へは
 * 章の slug を渡し、盤面が絞り込みを引く。練習も試験も無い章（「はじめに」の
 * セクション）では何も出さない。
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
  const tAll = useTranslations();
  const router = useRouter();
  const freePractice = LESSON_SCORE_PRACTICES[slug];
  const links = relatedPracticeLinks(slug).filter(
    (link) =>
      exclude === undefined ||
      link.slug !== exclude.slug ||
      link.variant !== exclude.variant,
  );
  const examSlug = getChapterBySlug(slug)?.examSlug;
  const [ad] = useNativeAds(MOBILE_AD_SLOTS.lessonPractices);
  const hasPractice = links.length > 0 || freePractice !== undefined;
  if (!hasPractice && examSlug === undefined) return undefined;

  return (
    <>
      {hasPractice && (
        <View style={styles.section}>
          <SectionTitle>{t("practiceTitle")}</SectionTitle>
          {links.length > 0 && (
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
          )}
          {freePractice !== undefined && (
            <Button
              onPress={() =>
                router.push({
                  pathname: `${AGARI_SCORE_PRACTICE_HREF}/play`,
                  params: { lesson: slug },
                })
              }
              size="lg"
              fullWidth
              testID="lesson-free-practice"
            >
              {tAll(freePractice.labelKey)}
            </Button>
          )}
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
