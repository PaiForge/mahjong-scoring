/**
 * レッスン
 *
 * @description
 * 教本の章 1 つを「短い説明 → ヒント付きの確認問題 → できたことの確認」に
 * 圧縮した学習の最小単位。時間制限もミス上限も無く、間違えてもその場で解説を
 * 読んで先へ進める。黒帯への道の学ぶ段の 1 歩で、ダッシュボードの「次の一歩」
 * と道場の行程がここへ送る（登録直後の最初の一歩もレッスン）。最後まで
 * 答えると完了が記録され（ログイン時）、行程でその章を「学んだ」ことになる。
 * 完了は「回答と解説まで取り組んだ」印で、正解したことの印ではない —
 * 習得の判定は昇級試験が持つ。
 *
 * レッスンの一覧・順序はコードのレジストリ（features の `lessons/registry.ts`）が
 * 持つ。全 slug を `generateStaticParams` で列挙して静的生成し、`dynamicParams` を
 * 切って未知の slug を本物の 404 にする（用語ページと同じ構え）。cookie は
 * 読まない — ユーザーに依存するのは完了の記録だけで、それはクライアントが
 * 解き終えた時点で Server Action を呼ぶ。
 *
 * 説明の本文（点数表を含む）と完了画面の練習・教本への導線・広告はサーバーで描き、
 * 進行を持つクライアント部分（`LessonView`）へスロットで渡す。説明は章の
 * 本文そのものか、章と同じ表を使った要約なので、ここで見た表がそのまま章にも
 * 早見表にもある。
 *
 * @flow
 * ダッシュボードの「黒帯への第一歩 / 次の一歩」→ 説明を読む → 確認問題
 * （ヒントを見られる。不正解なら解説を読んで次へ）→ できたことの確認 →
 * ログイン済みなら黒帯への道の次の一歩（次のレッスン・練習・昇級試験）へ、
 * 未ログインなら登録への誘導。
 * その下に、同じ形の問題を解く練習（持つレッスンだけ）と教本の章を並べる
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { createMetadata } from "@/app/_lib/metadata";
import {
  LESSON_SLUGS,
  lessonBySlug,
} from "@mahjong-scoring/features/lessons/registry";
import { stepAfterLesson } from "@mahjong-scoring/features/journey/journey";
import { lessonHref } from "@mahjong-scoring/features/routes";

import { journeyStepHref, journeyStepTitle } from "../../_lib/journey-step";

import { LessonView } from "../_components/lesson-view";
import { LessonExplanation } from "../_components/lesson-explanation";
import { LessonRelatedLinks } from "../_components/lesson-related-links";
import { NextLessonPreview } from "../_components/next-lesson-preview";

interface LessonPageProps {
  readonly params: Promise<{ readonly slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams(): { slug: string }[] {
  return LESSON_SLUGS.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: LessonPageProps): Promise<Metadata> {
  const { slug } = await params;
  const lesson = lessonBySlug(slug);
  if (!lesson) return {};

  const t = await getTranslations(`lessons.${lesson.messageKey}`);
  return createMetadata({
    title: t("title"),
    description: t("description"),
    path: lessonHref(lesson.slug),
  });
}

export default async function LessonPage({ params }: LessonPageProps) {
  const { slug } = await params;
  const lesson = lessonBySlug(slug);
  if (!lesson) notFound();

  const [t, tLesson, tAll] = await Promise.all([
    getTranslations("lessons"),
    getTranslations(`lessons.${lesson.messageKey}`),
    getTranslations(),
  ]);

  // 黒帯への道でこのレッスンの次にある一歩。全レッスンが持つ（features の
  // テストが固定）が、無ければホームの「次の一歩」に任せる
  const step = stepAfterLesson(lesson.slug);
  const next = step
    ? {
        href: journeyStepHref(step),
        label: t(`nextStep.${step.kind}`, {
          title: journeyStepTitle(step, tAll),
        }),
        preview:
          step.kind === "lesson" ? (
            <NextLessonPreview slug={step.lessonSlug} />
          ) : undefined,
      }
    : { href: "/", label: t("continueHome") };

  return (
    <ContentContainer
      breadcrumb={[{ label: t("breadcrumb") }, { label: tLesson("title") }]}
    >
      <PageTitle>{tLesson("title")}</PageTitle>

      <LessonView
        slug={lesson.slug}
        messageKey={lesson.messageKey}
        chapterSlug={lesson.chapterSlug}
        next={next}
        explanation={
          <LessonExplanation
            slug={lesson.slug}
            messageKey={lesson.messageKey}
          />
        }
        related={<LessonRelatedLinks lesson={lesson} />}
      />
    </ContentContainer>
  );
}
