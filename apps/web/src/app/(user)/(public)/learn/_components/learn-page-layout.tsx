import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { GlossaryTermModalProvider } from "@/app/(user)/_components/glossary/glossary-term-modal-provider";
import { JsonLd } from "@/app/(user)/_components/json-ld";
import { NativeAdCard } from "@/app/(user)/(public)/_components/native-ad-card";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { getNativeAdCreative } from "@/lib/ads/creatives";
import { collectTermSlugsInNamespace } from "@/lib/glossary/message-terms";
import { resolveTermPreviews } from "@/lib/glossary/queries";
import {
  getChapterBySlug,
  type CurriculumChapterSlug,
} from "@mahjong-scoring/features/curriculum/registry";
import { stepAfterLesson } from "@mahjong-scoring/features/journey/journey";
import {
  isQuizLessonSlug,
  quizLessonBySlug,
  type QuizLessonSlug,
} from "@mahjong-scoring/features/lessons/registry";
import { menuTypeToSlug } from "@mahjong-scoring/features/practice-menu-types";
import { rankBySlug } from "@mahjong-scoring/features/ranks/registry";
import { journeyStepHref, journeyStepTitle } from "../../_lib/journey-step";
import { buildLearnArticleSchema } from "../_lib/json-ld";
import { chapterNamespace } from "../_lib/metadata";
import { formatPublishedDate } from "../_lib/published-date";
import { LESSON_SCROLL_ANCHOR_ID } from "../_lib/scroll-anchor";
import { ChapterCompleteButton } from "./chapter-complete-button";
import { ChapterNav } from "./chapter-nav";
import { ChapterRelatedLinks } from "./chapter-related-links";
import { LessonView } from "./lesson-view";
import { NextLessonPreview } from "./next-lesson-preview";
import { RankGoalPanel } from "./rank-goal-panel";

interface LearnPageLayoutProps {
  /** 対象章のスラッグ。辞書ネームスペースもここから導出する */
  readonly slug: CurriculumChapterSlug;
  /** 章の本文 */
  readonly children: ReactNode;
}

/**
 * レッスン（章）ページの共通レイアウト
 * レッスンレイアウト
 *
 * レッスンは教本の章そのもので、「本文 → 確認問題（持つ章だけ）→ 完了 →
 * 練習・昇級試験」の順に 1 ページで通す。黒帯への道の学ぶ段の 1 歩で、
 * ダッシュボードの「次にやること」と道場の行程がここへ送る。
 *
 * 章本文の前後に以下を描画する:
 * - ページタイトル（`<camelCase(slug)>.learn.pageTitle`）
 * - 章本文（children）— 本文中の用語リンクが開くモーダルごと包む
 * - 確認問題を持つ章: 本文の下の「確認問題へ」から確認問題 → できたことの
 *   確認（`LessonView`。進行はクライアントで、本文と入れ替わる）。完了画面は
 *   黒帯への道の次の一歩（次のレッスンの冒頭のプレビュー・練習・昇級試験）へ
 *   送り、級の最後のレッスンでは昇級試験までの進み具合を添える
 * - 確認問題を持たない章: 本文の下に完了ボタン（`ChapterCompleteButton`）。
 *   記録される印は確認問題と同じ
 * - 練習・昇級試験への導線（`ChapterRelatedLinks`）— 確認問題を持つ章では
 *   完了後に、持たない章では完了ボタンの下に。確認問題より前に押して始める
 *   ボタンを置かない
 * - 章末（`footer`）: ネイティブ広告（掲載中の広告があるときだけ。本文や
 *   練習への CTA より前には出さない）→ 前後のレッスンへのリンク → 公開日
 *   （`CURRICULUM` の `publishedAt`。Article の datePublished と同じ日付）
 *
 * @design cookie を読まない
 * ここで `getOptionalUser()` を呼ぶと章ページ全体が動的になり、CDN キャッシュに
 * 乗らず loading.tsx が要る（初期 HTML の本文が Suspense の後ろに回る）。
 * ユーザーに依存するのは完了の印と記録だけなので、そこだけをクライアントに
 * 委ね（Server Action で読む / 書く）、章本文は静的に生成する。確認問題の
 * 進行も初期状態は本文なので、初期 HTML には本文がそのまま入る。
 */
export async function LearnPageLayout({
  slug,
  children,
}: LearnPageLayoutProps) {
  const namespace = chapterNamespace(slug);
  const [t, tLearn, tChapter, tGlossary, tCompany] = await Promise.all([
    getTranslations(namespace),
    getTranslations("learnCurriculum.index"),
    getTranslations("learnCurriculum.chapter"),
    getTranslations("glossary"),
    getTranslations("company"),
  ]);
  const chapter = getChapterBySlug(slug);
  const quizLesson = quizLessonBySlug(slug);

  // 章の本文はすべて辞書にあるため、名前空間ごと走査すれば、その章が
  // リンクしている用語は漏れなく集まる。章側での列挙は要らない。
  const [termPreviews, ad] = await Promise.all([
    resolveTermPreviews(collectTermSlugsInNamespace(namespace)),
    getNativeAdCreative("learn-chapter-native-ad"),
  ]);

  const body = (
    <GlossaryTermModalProvider
      terms={termPreviews}
      viewDetailsLabel={tGlossary("viewDetails")}
      turnOffLabel={tGlossary("turnOffTermLinks")}
      closeLabel={tGlossary("closeLabel")}
    >
      {children}
    </GlossaryTermModalProvider>
  );

  const footer = (
    <>
      {ad && <NativeAdCard creative={ad} />}
      <ChapterNav slug={slug} />
      {/*
        章の鮮度を読者と検索側に示す（Article の datePublished と同じ日付）。
        本文の前ではなく末尾に置く — 白カードは他のページでは節の見出し
        （濃い緑の pill）から始まり、その手前に日付の 1 行が入ると、この
        ページだけ書き出しの形が違って見える。読み終えた人が見る位置で足りる
      */}
      {chapter && (
        <p className="text-xs text-surface-500">
          {tChapter("publishedOn", {
            date: formatPublishedDate(chapter.publishedAt),
          })}
        </p>
      )}
    </>
  );

  return (
    <ContentContainer
      // 確認問題の画面は練習と同じく本文の先頭を画面の最上部に送るので、
      // カード領域をスクロール先にして画面を埋める
      id={quizLesson ? LESSON_SCROLL_ANCHOR_ID : undefined}
      fillViewport={quizLesson !== undefined}
      breadcrumb={[
        { label: tLearn("pageTitle"), href: "/learn" },
        { label: t("pageTitle") },
      ]}
    >
      {chapter && (
        <JsonLd
          data={buildLearnArticleSchema({
            slug,
            headline: t("pageTitle"),
            description: t("pageDescription"),
            publishedAt: chapter.publishedAt,
            operatorName: tCompany("name.value"),
          })}
        />
      )}
      <PageTitle>{t("pageTitle")}</PageTitle>

      {quizLesson ? (
        <LessonView
          slug={quizLesson.slug}
          messageKey={quizLesson.messageKey}
          next={await nextStepAfter(quizLesson.slug)}
          explanation={body}
          related={<ChapterRelatedLinks slug={slug} />}
          footer={footer}
        />
      ) : (
        <div className="space-y-10">
          {body}
          <ChapterCompleteButton slug={slug} />
          <ChapterRelatedLinks slug={slug} />
          {footer}
        </div>
      )}
    </ContentContainer>
  );
}

/**
 * 確認問題の完了画面の主導線 — 黒帯への道でこのレッスンの次にある一歩
 *
 * 全レッスンが持つ（features のテストが固定）が、無ければホームの
 * 「次にやること」に任せる。次が確認問題を持つレッスンならその冒頭の
 * プレビュー、級の最後のレッスンならプレビューの代わりに級のゴールまでの
 * 残りを添える。道筋の順の一歩で、記録のときにサーバーが本人の進み具合から
 * 求めた一歩を返したら `LessonView` がそちらを使う。
 */
async function nextStepAfter(slug: QuizLessonSlug) {
  const [t, tAll] = await Promise.all([
    getTranslations("lessons"),
    getTranslations(),
  ]);
  const step = stepAfterLesson(slug);
  if (step === undefined) return { href: "/", label: t("continueHome") };
  const rank = rankBySlug(quizLessonBySlug(slug)?.rankSlug ?? "kyu-5");
  // 次のレッスンの抜粋は確認問題を持つレッスンの分しか無い（今の前提章は
  // すべて持つ）。持たないレッスンへはボタンで送る
  const nextLesson =
    step.kind === "lesson" && isQuizLessonSlug(step.chapterSlug)
      ? step.chapterSlug
      : undefined;
  return {
    href: journeyStepHref(step),
    label: t(`nextStep.${step.kind}`, { title: journeyStepTitle(step, tAll) }),
    preview: nextLesson ? <NextLessonPreview slug={nextLesson} /> : undefined,
    previewLessonSlug: nextLesson,
    goal:
      step.kind === "lesson" || rank === undefined ? undefined : (
        <RankGoalPanel
          rankSlug={rank.slug}
          examSlug={menuTypeToSlug(rank.exam.menuType)}
        />
      ),
  };
}
