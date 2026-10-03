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
 * 説明の本文（点数表を含む）はサーバーで描き、進行を持つクライアント部分
 * （`LessonView`）へスロットで渡す。表は教本の章と同じコンポーネントなので、
 * ここで見た表がそのまま章にも早見表にもある。
 *
 * @flow
 * ダッシュボードの「黒帯への第一歩 / 次の一歩」→ 説明を読む → 確認問題
 * （ヒントを見られる。不正解なら解説を読んで次へ）→ できたことの確認 →
 * ログイン済みなら「次の一歩へ」（ホーム）、未ログインなら登録への誘導
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
import { lessonHref } from "@mahjong-scoring/features/routes";

import { LessonView } from "../_components/lesson-view";
import { LessonExplanation } from "../_components/lesson-explanation";

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

  const [t, tLesson] = await Promise.all([
    getTranslations("lessons"),
    getTranslations(`lessons.${lesson.messageKey}`),
  ]);

  return (
    <ContentContainer
      breadcrumb={[{ label: t("breadcrumb") }, { label: tLesson("title") }]}
    >
      <PageTitle>{tLesson("title")}</PageTitle>

      <LessonView
        slug={lesson.slug}
        messageKey={lesson.messageKey}
        chapterSlug={lesson.chapterSlug}
        explanation={
          <LessonExplanation
            slug={lesson.slug}
            messageKey={lesson.messageKey}
          />
        }
      />
    </ContentContainer>
  );
}
