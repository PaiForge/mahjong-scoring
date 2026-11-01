import { Fragment, useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useTranslations } from "use-intl";
import { MOBILE_AD_SLOTS } from "@mahjong-scoring/features/ads/native-ad";
import { adIndexAfterGroup } from "@mahjong-scoring/features/ads/spacing";
import {
  CURRICULUM_SECTIONS,
  chaptersBySection,
  isColumnChapter,
  pickNextChapter,
  type CurriculumChapterSlug,
} from "@mahjong-scoring/features/curriculum/registry";
import {
  rankBySlug,
  type RankDefinition,
} from "@mahjong-scoring/features/ranks/registry";

import { NativeAdRow } from "../../ads/native-ad-row";
import { useNativeAds } from "../../ads/use-native-ads";
import { LinkRowList } from "../../components/link-row";
import { Screen } from "../../components/screen";
import { SectionTitle } from "../../components/section-title";
import { TextLink } from "../../components/text-link";
import { useCompletedLessons } from "../../records/use-account-progress";
import { colors } from "../../lib/theme";
import {
  CurriculumProgressBar,
  CurriculumToc,
} from "../../lessons/components/curriculum-toc";
import {
  countPortedCompleted,
  isLessonPorted,
  PORTED_LESSONS,
  UNPORTED_LESSON_SLUGS,
} from "../../lessons/ported-lessons";

/** セクション別の章（並びは変わらないので 1 回だけ組む） */
const GROUPED = chaptersBySection();

/**
 * このタブの navigation のうち使う分（タブのボタンの押下と params の書き換え）。
 * expo-router の `useNavigation` の既定の型はタブのイベントを持たないので、ここで絞る
 */
interface LessonsTabNavigation {
  addListener(type: "tabPress", callback: () => void): () => void;
  setParams(params: { readonly rank: undefined }): void;
}

/** `?rank=` から絞り込む級を引く。未知の級・前提レッスンを持たない級は絞らない */
function resolveRankFilter(value: unknown): RankDefinition | undefined {
  if (typeof value !== "string") return undefined;
  const rank = rankBySlug(value);
  if (rank === undefined || rank.learnChapterSlugs.length === 0) {
    return undefined;
  }
  return rank;
}

/**
 * レッスン（目次）
 *
 * @description
 * 進捗バーから始め、セクション（はじめに / 満貫 / 役 / 符 / 点数計算 / 記憶術）ごとに
 * レッスン（章）を並べ、完了の印・「次はここから」を出す（web の `/lessons`）。
 * 完了は端末に記録したもの。モバイルに本文を移植していないレッスンも並びに残すが
 * 開けず、進捗の分母と「次はここから」の候補から外す。セクションの切れ目に
 * 広告の行を間隔を広げながら置く（web と同じ）。
 *
 * `?rank=<級>` で開くと、その級の前提レッスンだけに絞った目次になる（web と同じ。
 * ホーム・道場の級の進み具合の「学ぶ」の行き先）。進捗バーと「次はここから」も
 * その級の中で数え、下に全レッスンへ戻る操作を置く。タブは開いたまま残るので、
 * 絞り込みは params に持ったまま、戻る操作とタブのボタンの押下で params から消す
 * （タブバーの「レッスン」はいつでも全体の目次の入口）。
 *
 * @flow
 * レッスンの行を押すと `/lessons/<slug>` を開く。
 */
export default function LessonsTab() {
  const { rank: rankParam } = useLocalSearchParams<{ rank?: string }>();
  const navigation = useNavigation<LessonsTabNavigation>();
  const rank = resolveRankFilter(rankParam);

  useEffect(
    () =>
      navigation.addListener("tabPress", () =>
        navigation.setParams({ rank: undefined }),
      ),
    [navigation],
  );

  if (rank !== undefined) {
    return (
      <RankLessonsIndex
        rank={rank}
        onShowAll={() => navigation.setParams({ rank: undefined })}
      />
    );
  }
  return <AllLessonsIndex />;
}

/** 全レッスンの目次 */
function AllLessonsIndex() {
  const t = useTranslations("learnCurriculum.index");
  const completedSlugs = useCompletedLessons();
  const next = pickNextChapter(
    new Set([...completedSlugs, ...UNPORTED_LESSON_SLUGS]),
  );
  const completedCount = countPortedCompleted(completedSlugs);
  const allCompleted = next === undefined;
  const ads = useNativeAds(MOBILE_AD_SLOTS.learnIndex);

  return (
    <Screen title={t("pageTitle")} inTabs>
      <View style={styles.page}>
        <CurriculumProgressBar
          completedCount={completedCount}
          totalCount={PORTED_LESSONS.length}
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

/**
 * 1 つの級の前提レッスンだけに絞った目次（web の `RankLessonsIndex`）
 *
 * 進捗バーと「次はここから」はその級のモバイルで開けるレッスンの中で数える。
 * 広告は置かない（セクションが 1〜2 個の短い一覧で、切れ目に挟むと広告が主役になる）。
 */
function RankLessonsIndex({
  rank,
  onShowAll,
}: {
  readonly rank: RankDefinition;
  readonly onShowAll: () => void;
}) {
  const t = useTranslations("learnCurriculum.index");
  const tRanks = useTranslations("ranks");
  const completedSlugs = useCompletedLessons();
  const rankSlugs: ReadonlySet<CurriculumChapterSlug> = new Set(
    rank.learnChapterSlugs,
  );
  const chapters = CURRICULUM_SECTIONS.flatMap(
    (section) => GROUPED.get(section) ?? [],
  ).filter((chapter) => rankSlugs.has(chapter.slug));
  const lessons = chapters.filter(
    (chapter) => !isColumnChapter(chapter) && isLessonPorted(chapter.slug),
  );
  const completedCount = lessons.filter((chapter) =>
    completedSlugs.has(chapter.slug),
  ).length;
  const next = lessons.find((chapter) => !completedSlugs.has(chapter.slug));

  return (
    <Screen title={t("pageTitle")} inTabs>
      <View style={styles.rankPage}>
        <SectionTitle>
          {t("rankFilterTitle", { rank: tRanks(`names.${rank.slug}`) })}
        </SectionTitle>
        <CurriculumProgressBar
          completedCount={completedCount}
          totalCount={lessons.length}
          allCompleted={next === undefined}
        />
        {CURRICULUM_SECTIONS.map((section) => (
          <CurriculumToc
            key={section}
            section={section}
            chapters={chapters.filter((chapter) => chapter.section === section)}
            completedSlugs={completedSlugs}
            nextSlug={next?.slug}
          />
        ))}
        <View style={styles.showAll}>
          <TextLink onPress={onShowAll} testID="lessons-show-all">
            {t("allLessonsLink")}
          </TextLink>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  page: {
    gap: 32,
  },
  rankPage: {
    gap: 24,
  },
  showAll: {
    alignItems: "center",
  },
  allCompleted: {
    fontSize: 14,
    textAlign: "center",
    color: colors.surface600,
  },
});
