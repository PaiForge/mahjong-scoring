/**
 * レッスン（目次）
 *
 * @description
 * セクション（はじめに / 満貫 / 役 / 符 / 点数計算 / 記憶術）ごとにレッスン（章）を
 * グルーピングし、完了の印・進捗率・「次はここから」ナビゲーションを表示する
 * 目次ページ。表示は Zenn の書籍目次風のシンプルな縦列リスト。ナビゲーションの
 * 「レッスン」の行き先。段級位の行程に属さない章（はじめに・記憶術）もここに並ぶ —
 * 級ごとの見え方は道場が持つ。
 * @flow
 * ユーザーは各レッスンのタイトルのリンクから対応する `/lessons/<slug>` へ遷移する。
 * 未認証ユーザーでも進捗は空として表示され、最初のレッスンが「次はここから」となる。
 * ログインしていれば、表示の後に本人の完了の印・進捗・次が付く。
 *
 * **静的ルート**（cookie も searchParams もサーバーで読まない）。目次の公共の部分
 * （章の並び・文言・広告）は閲覧者に依らないのでビルド時に焼き、閲覧者に依る部分は
 * クライアントの `LessonsIndex` が後から付ける:
 *
 * - 完了の印・進捗・「次はここから」は `LessonProgressProvider` がログインを
 *   確かめてから Server Action `getCompletedLessonSlugs()` で取って上書きする。
 *   静的 HTML はゲストの状態（完了なし・次は最初のレッスン）
 * - `?rank=<級>`（ダッシュボード・道場の級の進み具合の「学ぶ」の行き先）は
 *   `useSearchParams` で読んでクライアントで絞る。静的 HTML と Suspense の
 *   fallback は全体の目次。パンくずは絞った目次でも 1 段のまま（サーバーは
 *   絞り込みを知らない）
 *
 * 英語の索引対象は静的生成であることが規約（`loading-boundaries.test.ts`）で、
 * 以前の「完了を cookie から読む動的ルート + loading.tsx」をこの形に改めた。
 * route group `(index)` は、その頃 loading.tsx が兄弟ルート（`/lessons/<slug>`）の
 * 祖先にならないよう退避するためのもの。今は境界を持たないので要らないが、
 * 移しても描画は変わらないため置いたままにしている。
 *
 * 英語の目次では、英語で出していない章の行を「日本語のみ」の印付きの日本語の
 * リンク（`<a hrefLang="ja">`）にし、英語の存在しない URL を作らない。
 * 「次はここから」と進捗の分母は英語で出しているレッスンだけから数える。
 *
 * 行は `#chapter-<slug>` で指せる。章の抜粋（練習の説明ページ等）の
 * 「目次へ」がその位置へ着地させるのに使う。
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";

import { HashAnchorScroll } from "@/app/_components/hash-anchor-scroll";
import { ContentContainer } from "@/app/[locale]/(user)/_components/content-container";
import { LinkRowList } from "@/app/[locale]/(user)/_components/link-row";
import { NativeAdRow } from "@/app/[locale]/(user)/_components/native-ad-row";
import { PageTitle } from "@/app/[locale]/(user)/_components/page-title";
import { resolveNavTargetFor } from "@/app/[locale]/(user)/_components/_lib/locale-nav-target";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import { prepareRouteLocale } from "@/i18n/route-locale";
import { getNativeAdPlacements } from "@/lib/ads/creatives";
import { adIndexAfterGroup } from "@mahjong-scoring/features/ads/spacing";
import {
  CURRICULUM_SECTIONS,
  chaptersBySection,
  type CurriculumSection,
} from "@mahjong-scoring/features/curriculum/registry";
import { LESSONS_PATH } from "@mahjong-scoring/features/routes";
import { getTranslations } from "next-intl/server";

import { chapterRowsFor } from "../_components/curriculum-toc";
import { LessonsIndex } from "../_components/lessons-index";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/lessons">): Promise<Metadata> {
  const locale = await prepareRouteLocale(params, "/lessons");
  return createNamespaceMetadata("learnCurriculum.index", {
    title: "pageTitle",
    description: "pageDescription",
    path: LESSONS_PATH,
    locale,
  });
}

export default async function LearnIndexPage({
  params,
}: PageProps<"/[locale]/lessons">) {
  const locale = await prepareRouteLocale(params, "/lessons");
  const grouped = chaptersBySection();
  const chapters = CURRICULUM_SECTIONS.flatMap(
    (section) => grouped.get(section) ?? [],
  );
  const [t, rows, ads] = await Promise.all([
    getTranslations("learnCurriculum.index"),
    chapterRowsFor(chapters, locale),
    getNativeAdPlacements("learn-index-native-ad", locale),
  ]);

  // 広告はセクションの切れ目に 1 行ずつ（位置は adIndexAfterGroup。章を持たない
  // セクションは目次に出ないので、その後ろの広告も出さない）。目次は枠を
  // 持たない（印と破線だけ）ので、広告の行も枠を描かない
  const adsAfterSection: Partial<Record<CurriculumSection, ReactNode>> = {};
  CURRICULUM_SECTIONS.forEach((section, index) => {
    if ((grouped.get(section) ?? []).length === 0) return;
    const adIndex = adIndexAfterGroup(index);
    const ad = adIndex === undefined ? undefined : ads[adIndex];
    if (ad === undefined) return;
    adsAfterSection[section] = (
      <LinkRowList inset>
        <NativeAdRow creative={ad} />
      </LinkRowList>
    );
  });

  return (
    <ContentContainer breadcrumb={[{ label: t("pageTitle") }]}>
      <PageTitle>{t("pageTitle")}</PageTitle>
      <HashAnchorScroll />
      <LessonsIndex
        rows={rows}
        adsAfterSection={adsAfterSection}
        allLessonsTarget={resolveNavTargetFor(LESSONS_PATH, locale)}
      />
    </ContentContainer>
  );
}
