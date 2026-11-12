import { useCallback, useRef, type ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useTranslations } from "use-intl";
import { MOBILE_AD_SLOTS } from "@mahjong-scoring/features/ads/native-ad";
import { chapterNamespace } from "@mahjong-scoring/features/curriculum/chapter-namespace";
import {
  isCurriculumChapterSlug,
  isLessonChapterSlug,
  type CurriculumChapterSlug,
} from "@mahjong-scoring/features/curriculum/registry";
import { quizLessonBySlug } from "@mahjong-scoring/features/lessons/registry";

import { NativeAdRow } from "../ads/native-ad-row";
import { useNativeAds } from "../ads/use-native-ads";
import { LinkRowList } from "../components/link-row";
import { Screen, type ScreenHandle } from "../components/screen";
import { TextLink } from "../components/text-link";
import { useLessonDone } from "../records/use-account-progress";
import { colors } from "../lib/theme";
import { ChapterCompleteButton } from "./components/chapter-complete-button";
import { ChapterPublishedDate } from "./components/chapter-published-date";
import { ChapterRelatedLinks } from "./components/chapter-related-links";
import { LessonView } from "./components/lesson-view";
import {
  NextLessonPreview,
  nextChapterSlug,
} from "./components/next-lesson-preview";
import { PrevLessonLink } from "./components/prev-lesson-link";
import { renderLessonGuide } from "./guide-registry";
import { LESSONS_PATH } from "@mahjong-scoring/features/routes";
import { useGoToTab } from "../hooks/use-go-to-tab";

/**
 * レッスンが見つからない（未知の slug・モバイル未移植の章）
 */
function LessonNotFound() {
  const tn = useTranslations("notFound");
  const t = useTranslations("learnCurriculum");
  const goToTab = useGoToTab();
  return (
    <Screen title={tn("title")} back>
      <Text style={styles.notFound}>{tn("description")}</Text>
      <TextLink onPress={() => goToTab(LESSONS_PATH)}>{t("tocLink")}</TextLink>
    </Screen>
  );
}

/**
 * レッスン（章）の画面（web の `LearnPageLayout`）
 * レッスン画面
 *
 * 「本文 → 確認問題（持つ章だけ）→ 完了 → 練習」の順に 1 画面で通す。
 *
 * - 確認問題を持つ章: 本文の下の「確認問題へ」から確認問題 → できたことの
 *   確認（`LessonView`。本文と入れ替わる）
 * - 確認問題を持たない章: 本文の下に完了ボタンと練習への導線。完了にしたら
 *   目次の順の次のレッスンを出し、そのまま読み進められるようにする
 * - コラム: 完了を持たないので、本文の下に初めから次のレッスンを出す
 *   （出さないと戻る以外の行き先が無い）
 * - 章末: 広告 1 行・前のレッスン・公開日（web と同じ並び。web は前後の
 *   両方を置くが、こちらは前だけ）
 *
 * レッスン同士は置き換えて移る。次へは完了の後の「次のレッスン」、前へは
 * 章末の「前のレッスン」（`PrevLessonLink`）で、どちらもスタックに積まない
 * ので、何章行き来してもヘッダーの戻る 1 回で学習を始めた画面へ帰れる
 * （理由は `PrevLessonLink` の TSDoc）。本文の用語は web のモーダルの代わりに
 * 用語のシートを開く（`TermText`）。
 *
 * @param slug ルートの slug（未検証）
 */
export function LessonScreen({ slug }: { readonly slug: string | undefined }) {
  if (slug === undefined || !isCurriculumChapterSlug(slug))
    return <LessonNotFound />;
  const guide = renderLessonGuide(slug);
  if (guide === undefined) return <LessonNotFound />;
  return <LessonScreenContent slug={slug} guide={guide} />;
}

function LessonScreenContent({
  slug,
  guide,
}: {
  readonly slug: CurriculumChapterSlug;
  readonly guide: ReactNode;
}) {
  const t = useTranslations(chapterNamespace(slug));
  const scrollRef = useRef<ScreenHandle>(null);
  const scrollTop = useCallback(() => {
    scrollRef.current?.scrollToTop();
  }, []);
  const quizLesson = quizLessonBySlug(slug);
  const completed = useLessonDone(slug);
  const nextSlug = nextChapterSlug(slug);
  const [ad] = useNativeAds(MOBILE_AD_SLOTS.learnChapter);
  // 章末の公開日の上に広告を 1 行と前のレッスン。周りは表・ボタン・
  // テキストリンクで練習カードが無いため、カードにすると本文から浮く。
  // 枠の無い 1 行で置く（web と同じ）
  const footer = (
    <>
      {ad !== undefined && (
        <LinkRowList inset>
          <NativeAdRow creative={ad} />
        </LinkRowList>
      )}
      <PrevLessonLink slug={slug} />
      <ChapterPublishedDate slug={slug} />
    </>
  );

  return (
    <Screen ref={scrollRef} title={t("pageTitle")} back>
      {quizLesson ? (
        <LessonView
          slug={quizLesson.slug}
          messageKey={quizLesson.messageKey}
          explanation={guide}
          footer={footer}
          onScrollTop={scrollTop}
        />
      ) : (
        <View style={styles.body}>
          {guide}
          {/* コラムは完了を持たない（ChapterKind）ので、次のレッスンを初めから出す */}
          {isLessonChapterSlug(slug) && <ChapterCompleteButton slug={slug} />}
          {(completed || !isLessonChapterSlug(slug)) &&
            nextSlug !== undefined && <NextLessonPreview slug={nextSlug} />}
          <ChapterRelatedLinks slug={slug} />
          {footer}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: {
    gap: 40,
  },
  notFound: {
    fontSize: 14,
    color: colors.surface500,
    textAlign: "center",
  },
});
