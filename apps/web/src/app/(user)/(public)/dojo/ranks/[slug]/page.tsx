/**
 * 段級位の詳細
 *
 * @description
 * 1 つの級について、合格基準・閲覧者にとっての取得状態・受験前に読む教本の
 * 章（読了チェック付き）・試験への導線を 1 ページで示す。道場（`/dojo`）が
 * 「次に取る級」についてだけ出している内容を、どの級についても読めるように
 * したもの。
 *
 * 教本の章はここへ取り込まず、章の一覧からリンクで `/lessons` へ送る。級と
 * 章は 1 : n で、章は級と独立に読む価値があり、検索からの入口も章ごとの
 * URL が持っているため。級と章の対応は段級位レジストリの
 * `learnChapterSlugs` が持つ。
 *
 * @design 未知の slug はソフト 404（200 + noindex）になる
 * 取得状態と読了をサーバーで描く動的ルートで、leaf に `loading.tsx` を持つ。
 * loading 境界の下では `notFound()` を呼んでもステータスは 200 になる
 * （フォールバックを流し始めた時点でヘッダが確定する）。用語ページのように
 * `generateStaticParams` + `dynamicParams = false` で弾く手は、動的ルートでは
 * 効かない（2026-10 に本番ビルドで実測。未知の slug も描画まで進む）。
 * 未知の slug はどこからもリンクされず、Next が not-found の描画に noindex を
 * 入れるため、お知らせ詳細・公開プロフィールと同じくこのまま受け入れている。
 * 本物の 404 が要るなら、ページを静的にして取得状態をクライアントで重ねる。
 *
 * @flow
 * 1. 道場の行程（黒帯への道）のカードの級名から遷移する
 * 2. 前提となる教本の章を読む（読了チェックが進捗を示す）
 * 3. 試験の説明ページへ進む（受験資格は試験ページ側が判定する）
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { BeltBadge } from "@/app/(user)/_components/belt-badge";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { ChapterTocList } from "@/app/(user)/(public)/lessons/_components/chapter-toc-list";
import { CurriculumTocLink } from "@/app/(user)/(public)/lessons/_components/curriculum-toc-link";
import { ExamCtaCard } from "@/app/(user)/(public)/lessons/_components/exam-cta-card";
import { fetchCompletedLessonSlugs } from "@/app/(user)/(public)/lessons/_lib/lesson-progress";
import { createMetadata } from "@/app/_lib/metadata";
import { getOptionalUser } from "@/lib/auth";
import { getUserRankSlugs } from "@/lib/db/rank-queries";
import { beltBorderClass } from "@/lib/ranks/belt-colors";
import { menuTypeToSlug } from "@mahjong-scoring/features/practice-menu-types";
import { resolveRankStatus } from "@mahjong-scoring/features/ranks/rank-status";
import { rankBySlug } from "@mahjong-scoring/features/ranks/registry";
import { rankHref } from "@mahjong-scoring/features/routes";

import { RankStatusBadge } from "../_components/rank-status-badge";

interface RankDetailPageProps {
  readonly params: Promise<{ readonly slug: string }>;
}

export async function generateMetadata({
  params,
}: RankDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const rank = rankBySlug(slug);
  // 未知の slug は本文が notFound() を呼び、Next が noindex を付けた
  // not-found を描く。ここでは何も宣言しない
  if (!rank) return {};

  const [t, tRanks] = await Promise.all([
    getTranslations("dojo"),
    getTranslations("ranks"),
  ]);
  const rankName = tRanks(`names.${rank.slug}`);
  return createMetadata({
    title: t("rankDetail.title", { rank: rankName }),
    description: t("rankDetail.description", {
      rank: rankName,
      criterion: tRanks(`criteria.${rank.slug}`),
    }),
    path: rankHref(rank.slug),
  });
}

export default async function RankDetailPage({ params }: RankDetailPageProps) {
  const { slug } = await params;
  const rank = rankBySlug(slug);
  if (!rank) notFound();

  const [t, tRanks, user, completedSlugs] = await Promise.all([
    getTranslations("dojo"),
    getTranslations("ranks"),
    getOptionalUser(),
    fetchCompletedLessonSlugs(),
  ]);
  const achievedSlugs = user ? await getUserRankSlugs(user.id) : [];
  const rankName = tRanks(`names.${rank.slug}`);
  const hasChapters = rank.learnChapterSlugs.length > 0;

  return (
    <ContentContainer
      breadcrumb={[{ label: t("title"), href: "/dojo" }, { label: rankName }]}
    >
      <PageTitle>{rankName}</PageTitle>

      <div className="space-y-8">
        {/* 枠は帯色（道場の「現在の段級位」カードと同じ理由）。級名は見出しが
            持つので、ここは帯・取得状態・合格基準だけを置く */}
        <div
          data-belt-slug={rank.slug}
          className={`flex items-center gap-4 rounded-xl border-3 bg-white p-5 ${beltBorderClass(rank.slug)}`}
        >
          <BeltBadge slug={rank.slug} size="lg" />
          <div className="min-w-0 space-y-2">
            <RankStatusBadge
              status={resolveRankStatus(rank.slug, achievedSlugs)}
            />
            <dl className="flex gap-2 text-sm text-surface-700">
              <dt className="shrink-0 font-bold">
                {tRanks("examCta.criterionLabel")}:
              </dt>
              <dd>{tRanks(`criteria.${rank.slug}`)}</dd>
            </dl>
          </div>
        </div>

        {/* 前提のレッスンを持たない級では節ごと出さない。見出しだけが残ると、
            レッスンが 1 つも無いのに空の節が並ぶ（道場と同じ扱い） */}
        {hasChapters && (
          <section className="space-y-4">
            <SectionTitle>{t("chaptersTitle")}</SectionTitle>
            <ChapterTocList
              slugs={rank.learnChapterSlugs}
              completedSlugs={completedSlugs}
            />
            <CurriculumTocLink />
          </section>
        )}

        <ExamCtaCard
          slug={menuTypeToSlug(rank.exam.menuType)}
          lead={
            hasChapters
              ? t("examLead")
              : t("rankDetail.examLeadWithoutChapters")
          }
        />
      </div>
    </ContentContainer>
  );
}
