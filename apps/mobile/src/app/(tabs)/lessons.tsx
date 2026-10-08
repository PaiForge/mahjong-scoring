import { Fragment } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { MOBILE_AD_SLOTS } from "@mahjong-scoring/features/ads/native-ad";
import { adIndexAfterGroup } from "@mahjong-scoring/features/ads/spacing";
import {
  CURRICULUM,
  CURRICULUM_SECTIONS,
  chaptersBySection,
  pickNextChapter,
} from "@mahjong-scoring/features/curriculum/registry";

import { NativeAdRow } from "../../ads/native-ad-row";
import { useNativeAds } from "../../ads/use-native-ads";
import { LinkRowList } from "../../components/link-row";
import { Screen } from "../../components/screen";
import { useCompletedLessons } from "../../records/use-account-progress";
import { colors } from "../../lib/theme";
import {
  CurriculumProgressBar,
  CurriculumToc,
} from "../../lessons/components/curriculum-toc";
import { isLessonPorted } from "../../lessons/ported-lessons";

/** モバイルで開けるレッスン（目次の順） */
const PORTED_CHAPTERS = CURRICULUM.filter((chapter) =>
  isLessonPorted(chapter.slug),
);

/** モバイルで開けないレッスン（「次はここから」の候補から外す） */
const UNPORTED_SLUGS = CURRICULUM.filter(
  (chapter) => !isLessonPorted(chapter.slug),
).map((chapter) => chapter.slug);

/** セクション別の章（並びは変わらないので 1 回だけ組む） */
const GROUPED = chaptersBySection();

/**
 * レッスン（目次）
 *
 * @description
 * 進捗バーから始め、セクション（基礎 / 満貫 / 役 / 符 / 点数計算 / 記憶術）ごとに
 * レッスン（章）を並べ、完了の印・「次はここから」を出す（web の `/lessons`）。
 * 完了は端末に記録したもの。モバイルに本文を移植していないレッスンも並びに残すが
 * 開けず、進捗の分母と「次はここから」の候補から外す。セクションの切れ目に
 * 広告の行を間隔を広げながら置く（web と同じ）。
 *
 * @flow
 * レッスンの行を押すと `/lessons/<slug>` を開く。
 */
export default function LessonsTab() {
  const t = useTranslations("learnCurriculum.index");
  const completedSlugs = useCompletedLessons();
  const next = pickNextChapter(new Set([...completedSlugs, ...UNPORTED_SLUGS]));
  const completedCount = PORTED_CHAPTERS.filter((chapter) =>
    completedSlugs.has(chapter.slug),
  ).length;
  const allCompleted = next === undefined;
  const ads = useNativeAds(MOBILE_AD_SLOTS.learnIndex);

  return (
    <Screen title={t("pageTitle")} inTabs>
      <View style={styles.page}>
        <CurriculumProgressBar
          completedCount={completedCount}
          totalCount={PORTED_CHAPTERS.length}
          allCompleted={allCompleted}
        />

        {CURRICULUM_SECTIONS.map((section, index) => {
          const adIndex = adIndexAfterGroup(index);
          const ad = adIndex === undefined ? undefined : ads[adIndex];
          return (
            <Fragment key={section}>
              <CurriculumToc
                section={section}
                chapters={GROUPED.get(section) ?? []}
                completedSlugs={completedSlugs}
                nextSlug={next?.slug}
              />
              {/* 広告はセクションの切れ目に 1 行ずつ。セクションの中（章の並び）には
                  入れない — レッスンの順序は学習の順序で、間に挟まると順路が途切れる。
                  目次は枠を持たないので、広告の行も枠を描かない（web と同じ） */}
              {ad !== undefined && (
                <LinkRowList inset>
                  <NativeAdRow creative={ad} />
                </LinkRowList>
              )}
            </Fragment>
          );
        })}

        {allCompleted && (
          <Text style={styles.allCompleted}>{t("allCompletedMessage")}</Text>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 32,
  },
  allCompleted: {
    fontSize: 14,
    textAlign: "center",
    color: colors.surface600,
  },
});
