/**
 * 練習一覧
 *
 * @description 練習一覧ページ。符計算・翻数の各練習をカテゴリ別に表示し、
 * 段級位で絞り込める。絞り込みは URL のクエリ（`?rank=kyu-4`）が持ち、
 * 昇級試験のページから「この試験の練習」として級を指定して開かれる。
 * @flow 練習カードから各練習の説明ページまたはプレイページへ遷移する。
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { chapterHref } from "@/app/(user)/(public)/learn/_lib/curriculum";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { LinkRow, LinkRowList } from "@/app/(user)/_components/link-row";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import { RANK_SLUGS } from "@/lib/ranks/registry";
import { ComprehensivePracticeBanner } from "../_components/comprehensive-practice-banner";
import { PracticeCard } from "../_components/practice-card";
import {
  PracticeRankFilter,
  type PracticeFilterSection,
} from "../_components/practice-rank-filter";
import { practiceCardRank } from "../_lib/practice-card-rank";
import {
  PRACTICE_CATEGORIES,
  practiceDescriptionKey,
  practiceHref,
  practiceMenusByCategory,
  practiceTitleKey,
} from "../_lib/practice-catalog";

export async function generateMetadata(): Promise<Metadata> {
  return createNamespaceMetadata("practice", { path: "/practice" });
}

export default async function PracticePage() {
  const [t, tRanks] = await Promise.all([
    getTranslations("practice"),
    getTranslations("ranks"),
  ]);

  // カードはここで全件描画し、絞り込みは表示するかどうかの判断だけを
  // クライアントに渡す（プリレンダーされた HTML に全カードが載るように）
  const sections: readonly PracticeFilterSection[] = PRACTICE_CATEGORIES.map(
    (category) => ({
      key: category,
      title: t(`categories.${category}.title`),
      cards: practiceMenusByCategory(category).map((practice) => ({
        key: practice.slug,
        rank: practice.rank,
        card: (
          <PracticeCard
            href={practiceHref(practice.slug)}
            title={t(practiceTitleKey(practice.slug))}
            description={t(practiceDescriptionKey(practice.slug))}
            rank={practiceCardRank(practice.rank, tRanks)}
            startLabel={t("start")}
            learnHref={
              practice.learnChapter
                ? chapterHref(practice.learnChapter)
                : undefined
            }
            learnLabel={practice.learnChapter ? t("learn") : undefined}
          />
        ),
      })),
    }),
  );

  return (
    <ContentContainer breadcrumb={[{ label: t("title") }]}>
      <PageTitle>{t("title")}</PageTitle>

      <div className="space-y-8">
        {/* 総合演習には見出しを付けない。バナー自身が名前を持っており、
            ここに h2 を足すと下のカテゴリ見出しと同じ pill が入れ子に並んで
            「符の計算・翻数・点数計算が総合演習の下位」に見えてしまう。 */}
        <ComprehensivePracticeBanner />

        <PracticeRankFilter
          sections={sections}
          filterLabel={t("rankFilter.label")}
          options={[
            { label: t("rankFilter.all") },
            // 級の並びはレジストリの順（5級 → 4級 の学習順）。一覧の
            // 並びも学習順なので、選択肢だけ級位の数字順にはしない
            ...RANK_SLUGS.map((rank) => ({
              rank,
              label: tRanks(`names.${rank}`),
            })),
          ]}
        />

        {/* 昇級試験は練習カードにしない（合格ラインを持ち段級位が授与される、
            練習とは種類の違うコンテンツ）。入口は道場が持つため、ここは
            見に行くだけの行リンクで送る。 */}
        <LinkRowList>
          <LinkRow
            href="/dojo"
            leading={
              <span className="text-base" aria-hidden="true">
                🥋
              </span>
            }
            title={t("dojoRow.title")}
            description={t("dojoRow.description")}
          />
        </LinkRowList>
      </div>
    </ContentContainer>
  );
}
