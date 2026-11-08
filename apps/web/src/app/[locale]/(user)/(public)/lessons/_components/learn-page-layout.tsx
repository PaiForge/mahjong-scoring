import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { ContentContainer } from "@/app/[locale]/(user)/_components/content-container";
import { GlossaryTermModalProvider } from "@/app/[locale]/(user)/_components/glossary/glossary-term-modal-provider";
import { JsonLd } from "@/app/[locale]/(user)/_components/json-ld";
import { LinkRowList } from "@/app/[locale]/(user)/_components/link-row";
import { NativeAdRow } from "@/app/[locale]/(user)/_components/native-ad-row";
import { PageTitle } from "@/app/[locale]/(user)/_components/page-title";
import { getNativeAdCreative } from "@/lib/ads/creatives";
import { resolvePublishedHref } from "@/i18n/navigation";
import { localizedHref } from "@/i18n/public-path";
import { buildSignInHref } from "@/lib/redirect";
import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import { collectTermSlugsInNamespace } from "@/lib/glossary/message-terms";
import { resolveTermPreviews } from "@/lib/glossary/queries";
import {
  chapterPublishedAtFor,
  getChapterBySlug,
  isColumnChapter,
  type CurriculumChapterSlug,
} from "@mahjong-scoring/features/curriculum/registry";
import type { SupportedLocale } from "@mahjong-scoring/features/i18n/locales";
import { stepAfterLesson } from "@mahjong-scoring/features/journey/journey";
import {
  isQuizLessonSlug,
  quizLessonBySlug,
  type QuizLessonSlug,
} from "@mahjong-scoring/features/lessons/registry";
import { menuTypeToSlug } from "@mahjong-scoring/features/practice-menu-types";
import { rankBySlug } from "@mahjong-scoring/features/ranks/registry";
import {
  journeyStepHref,
  journeyStepTitle,
} from "@mahjong-scoring/features/journey/journey-step";
import { buildLearnArticleSchema } from "../_lib/json-ld";
import { chapterNamespace } from "@mahjong-scoring/features/curriculum/chapter-namespace";
import { formatPublishedDate } from "@mahjong-scoring/features/curriculum/published-date";
import { LESSON_SCROLL_ANCHOR_ID } from "../_lib/scroll-anchor";
import { ChapterCompleteButton } from "./chapter-complete-button";
import { ChapterNav } from "./chapter-nav";
import { ChapterRelatedLinks } from "./chapter-related-links";
import { LessonView } from "./lesson-view";
import { NextLessonPreview } from "./next-lesson-preview";
import { RankGoalPanel } from "./rank-goal-panel";
import { chapterHref, LESSONS_PATH } from "@mahjong-scoring/features/routes";

/**
 * 完了の記録に要るログイン画面。この画面をページの言語で出しているときだけ
 * 確認問題・完了ボタンを出す（{@link LearnPageLayout} の `@design`）
 */
const SIGN_IN_PATH = "/sign-in";

/** 未ログインで確認問題を解き終えた人を送る登録画面（ロケール非依存のパス） */
const SIGN_UP_PATH = "/sign-up";

interface LearnPageLayoutProps {
  /** 対象章のスラッグ。辞書ネームスペースもここから導出する */
  readonly slug: CurriculumChapterSlug;
  /**
   * ページの言語（`prepareRouteLocale` の戻り値）。広告・JSON-LD・公開日の書式・
   * 前後のリンク・確認問題を出すかをこの言語で決める。省略できない —
   * 渡し忘れると英語のページが日本語の公開日や広告を出すので、型で止める
   */
  readonly locale: SupportedLocale;
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
 *   記録される印は確認問題と同じ。コラム（`ChapterKind`）は完了を持たないので
 *   出さない
 * - 練習・昇級試験への導線（`ChapterRelatedLinks`）— 確認問題を持つ章では
 *   完了後に、持たない章では完了ボタンの下に。確認問題より前に押して始める
 *   ボタンを置かない
 * - 章末（`footer`）: ネイティブ広告（掲載中の広告があるときだけ。本文や
 *   練習への CTA より前には出さない。枠の無い行の形 — 練習カードの形は
 *   練習カードの並ぶ所でしか周りに溶けない）→ 前後のレッスンへのリンク → 公開日
 *   （その言語のページの公開日。Article の datePublished と同じ日付）
 *
 * @design 公開日はその言語のページの公開日だけを出す
 * 日本語は `CURRICULUM` の `publishedAt`、英語は `translatedAt.en`
 * （`chapterPublishedAtFor`）。英語の公開日が記録されていない章では、章末の
 * 「{date} 公開」も Article の `datePublished` も出さない。日本語の公開日や
 * ビルド時刻で代用すると、実際と違う公開日を名乗ることになる。
 *
 * @design 確認問題・完了ボタンは、その言語にログイン画面があるときだけ出す
 * 完了の記録にはログインが要る。確認問題（`LessonView`）と完了ボタンは、
 * ページの言語でログイン画面（`/sign-in`）を公開している言語でだけ出す
 * （日本語と、ログイン画面を公開した英語）。出していない言語では本文 →
 * 練習・試験への導線 → 章末だけを出す。確認問題を解いた先が別の言語の
 * 登録画面になるのを避けるため。判定は言語の分岐ではなく公開状態なので、
 * その言語のログイン画面を公開すれば何も書き換えずに現れる。
 * 練習・試験への導線も同じく行き先の公開状態で出し分ける（`ChapterRelatedLinks`）。
 *
 * @design 確認問題・完了の遷移先はここ（サーバー）で言語付きに組む
 * 完了画面の次の一歩（{@link nextStepAfter}）・ホーム・ログインし直し・登録の
 * 張る先は、ページの言語の公開 URL にしてから `LessonView` /
 * `ChapterCompleteButton` に渡す。クライアントの部品は公開状態を読めない
 * （`route-policy.ts` はサーバー専用で、`client-bundle-boundaries.test.ts` が
 * クライアントのツリーから届かないことを検査する）ので、受け取った href を
 * 描くだけにする。
 * - 次の一歩（レッスン・練習・昇級試験）とホームは `localizedHref`。行き先は
 *   どれも確認問題を出す言語で公開済みのため、公開状態を問い直さない
 * - ログインし直しは `buildSignInHref`。ログイン画面も戻り先（この章）も
 *   ページの言語の公開 URL にする — 英語の章からログインして日本語の章へ
 *   戻されないため。`ChapterCompleteButton` は言語だけを受けて同じ規則で
 *   組む（`lib/redirect.ts` は公開状態を読まない純粋な変換なので
 *   クライアントから呼べる）
 * - 登録は `resolveNavTargetFor`。`SignUpPanel` が `navTarget` を見て、
 *   未公開なら「日本語のみ」の印付きで日本語の登録へ送る（公開済みなら同じ
 *   言語のまま）
 * 日本語では `localizedHref` が恒等なので、日本語のページの href は変わらない。
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
  locale,
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
  const publishedAt = chapter && chapterPublishedAtFor(chapter, locale);
  const interactive = resolvePublishedHref(SIGN_IN_PATH, locale) !== undefined;
  const quizLesson = interactive ? quizLessonBySlug(slug) : undefined;

  // 章の本文はすべて辞書にあるため、名前空間ごと走査すれば、その章が
  // リンクしている用語は漏れなく集まる。章側での列挙は要らない。
  const [termPreviews, ad] = await Promise.all([
    resolveTermPreviews(collectTermSlugsInNamespace(namespace)),
    getNativeAdCreative("learn-chapter-native-ad", locale),
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
      {ad && (
        <LinkRowList inset>
          <NativeAdRow creative={ad} />
        </LinkRowList>
      )}
      <ChapterNav slug={slug} locale={locale} />
      {/*
        章の鮮度を読者と検索側に示す（Article の datePublished と同じ日付）。
        本文の前ではなく末尾に置く — 白カードは他のページでは節の見出し
        （濃い緑の pill）から始まり、その手前に日付の 1 行が入ると、この
        ページだけ書き出しの形が違って見える。読み終えた人が見る位置で足りる
      */}
      {publishedAt && (
        <p className="text-xs text-surface-500">
          {tChapter("publishedOn", {
            date: formatPublishedDate(publishedAt, locale),
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
        { label: tLearn("pageTitle"), href: LESSONS_PATH },
        { label: t("pageTitle") },
      ]}
    >
      {chapter && (
        <JsonLd
          data={buildLearnArticleSchema({
            slug,
            headline: t("pageTitle"),
            description: t("pageDescription"),
            publishedAt,
            operatorName: tCompany("name.value"),
            locale,
          })}
        />
      )}
      <PageTitle>{t("pageTitle")}</PageTitle>

      {quizLesson ? (
        <LessonView
          slug={quizLesson.slug}
          messageKey={quizLesson.messageKey}
          next={await nextStepAfter(quizLesson.slug, locale)}
          signInHref={chapterSignInHref(quizLesson.slug, locale)}
          signUpTarget={resolveNavTargetFor(SIGN_UP_PATH, locale)}
          homeHref={localizedHref("/", locale)}
          locale={locale}
          explanation={body}
          related={<ChapterRelatedLinks slug={slug} locale={locale} />}
          footer={footer}
        />
      ) : (
        <div className="space-y-10">
          {body}
          {interactive && chapter && !isColumnChapter(chapter) && (
            <ChapterCompleteButton slug={slug} locale={locale} />
          )}
          <ChapterRelatedLinks slug={slug} locale={locale} />
          {footer}
        </div>
      )}
    </ContentContainer>
  );
}

/**
 * ログインしてこの章へ戻すログイン画面の URL（ページの言語の公開 URL）
 *
 * ログイン画面も戻り先も同じ言語にする（{@link LearnPageLayout} の `@design`）。
 * `buildSignInHref` は戻り先に触らないので、章の href を先に言語付きにして渡す。
 * `ChapterCompleteButton` も同じ組み方をする。
 */
function chapterSignInHref(
  slug: CurriculumChapterSlug,
  locale: SupportedLocale,
): string {
  return buildSignInHref(localizedHref(chapterHref(slug), locale), locale);
}

/**
 * 確認問題の完了画面の主導線 — 黒帯への道でこのレッスンの次にある一歩
 *
 * 全レッスンが持つ（features のテストが固定）が、無ければホームの
 * 「次にやること」に任せる。次が確認問題を持つレッスンならその冒頭の
 * プレビュー、級の最後のレッスンならプレビューの代わりに級のゴールまでの
 * 残りを添える。道筋の順の一歩で、記録のときにサーバーが本人の進み具合から
 * 求めた一歩を返したら `LessonView` がそちらを使う。
 *
 * href はページの言語の公開 URL（`localizedHref`）。行き先のレッスン・練習・
 * 昇級試験・ホームは、確認問題を出す言語ではどれも公開済み。
 */
async function nextStepAfter(slug: QuizLessonSlug, locale: SupportedLocale) {
  const [t, tAll] = await Promise.all([
    getTranslations("lessons"),
    getTranslations(),
  ]);
  const step = stepAfterLesson(slug);
  if (step === undefined)
    return { href: localizedHref("/", locale), label: t("continueHome") };
  const rank = rankBySlug(quizLessonBySlug(slug)?.rankSlug ?? "kyu-5");
  // 次のレッスンの抜粋は確認問題を持つレッスンの分しか無い（今の前提章は
  // すべて持つ）。持たないレッスンへはボタンで送る
  const nextLesson =
    step.kind === "lesson" && isQuizLessonSlug(step.chapterSlug)
      ? step.chapterSlug
      : undefined;
  return {
    href: localizedHref(journeyStepHref(step), locale),
    label: t(`nextStep.${step.kind}`, { title: journeyStepTitle(step, tAll) }),
    preview: nextLesson ? (
      <NextLessonPreview slug={nextLesson} locale={locale} />
    ) : undefined,
    previewLessonSlug: nextLesson,
    goal:
      step.kind === "lesson" || rank === undefined ? undefined : (
        <RankGoalPanel
          rankSlug={rank.slug}
          examSlug={menuTypeToSlug(rank.exam.menuType)}
          locale={locale}
        />
      ),
  };
}
