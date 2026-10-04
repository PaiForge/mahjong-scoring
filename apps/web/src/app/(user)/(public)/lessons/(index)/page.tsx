/**
 * レッスン一覧
 *
 * @description
 * 全レッスンを段級位ごとの節に並べ、終えたレッスンに完了の印を付ける。
 * 節は黒帯への道の順（5級 → 4級 → …）、節の中はレッスンレジストリの順
 * （行程で出会う順）。各節の見出しの下にその級で「できるようになること」を
 * 添え、何のために学ぶレッスンかを示す。
 *
 * 級の節は `#<級のスラッグ>` で指せる（`lessonListHref`）。進み具合の
 * 「学ぶ」とレッスンのパンくずがその級の節へ着地させるのに使う。
 *
 * 完了を cookie から読むため動的ルート。レッスンページ（`/lessons/<slug>`）は
 * 静的なので、一覧だけが持つ loading.tsx がレッスンの祖先にならないよう
 * route group に退避している（`loading-boundaries.test.ts` 参照）。未ログイン
 * なら完了の印は付かない（教本の目次の読了と同じ）。
 * @flow 行からレッスン（`/lessons/<slug>`）へ遷移する。
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { DoneMark } from "@/app/(user)/_components/done-mark";
import { HashAnchorScroll } from "@/app/(user)/_components/hash-anchor-scroll";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { LinkRow, LinkRowList } from "@/app/(user)/_components/link-row";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { SectionTitle } from "@/app/(user)/_components/section-title";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import { LESSON_REGISTRY } from "@mahjong-scoring/features/lessons/registry";
import { RANK_REGISTRY } from "@mahjong-scoring/features/ranks/registry";
import { lessonHref } from "@mahjong-scoring/features/routes";

import { fetchCompletedLessonSlugs } from "../_lib/progress";

export async function generateMetadata(): Promise<Metadata> {
  // canonical は文字列のまま書く（seo-coverage.test.ts がソースから照合する）
  return createNamespaceMetadata("lessons.index", { path: "/lessons" });
}

export default async function LessonsIndexPage() {
  const [t, tRanks, tAll, completedSlugs] = await Promise.all([
    getTranslations("lessons"),
    getTranslations("ranks"),
    getTranslations(),
    fetchCompletedLessonSlugs(),
  ]);

  const groups = RANK_REGISTRY.map((rank) => ({
    rank,
    lessons: LESSON_REGISTRY.filter((lesson) => lesson.rankSlug === rank.slug),
  })).filter((group) => group.lessons.length > 0);

  return (
    <ContentContainer breadcrumb={[{ label: t("index.title") }]}>
      <PageTitle>{t("index.title")}</PageTitle>
      <HashAnchorScroll />

      <div className="space-y-8">
        {groups.map(({ rank, lessons }) => (
          <section
            key={rank.slug}
            id={rank.slug}
            className="scroll-mt-24 space-y-4"
          >
            <div className="space-y-3">
              <SectionTitle>{tRanks(`names.${rank.slug}`)}</SectionTitle>
              <p className="text-sm text-surface-500">
                {tRanks(`criteria.${rank.slug}`)}
              </p>
            </div>
            <LinkRowList>
              {lessons.map((lesson) => (
                <LinkRow
                  key={lesson.slug}
                  href={lessonHref(lesson.slug)}
                  title={tAll(`lessons.${lesson.messageKey}.title`)}
                  trailing={
                    completedSlugs.has(lesson.slug) ? (
                      <DoneMark label={t("completedMark")} />
                    ) : undefined
                  }
                />
              ))}
            </LinkRowList>
          </section>
        ))}
      </div>
    </ContentContainer>
  );
}
