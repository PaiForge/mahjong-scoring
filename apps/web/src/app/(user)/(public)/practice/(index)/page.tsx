/**
 * 練習一覧
 *
 * @description 練習一覧ページ。すべての練習を 1 つのグリッドに並べ、段級位
 * （5級 / 4級）か分野（符 / 翻数 / 点数）のどちらか 1 つで絞り込める。
 * 絞り込みは URL のクエリ（`?rank=kyu-4` / `?category=han`）が持ち、
 * 昇級試験のページから級を指定して開かれる。
 * @flow 練習カードから各練習の説明ページまたはプレイページへ遷移する。
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { chapterHref } from "@/app/(user)/(public)/learn/_lib/curriculum";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { LinkRow, LinkRowList } from "@/app/(user)/_components/link-row";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import { ComprehensivePracticeBanner } from "../_components/comprehensive-practice-banner";
import { PracticeCard } from "../_components/practice-card";
import {
  PracticeFilter,
  type PracticeFilterItem,
} from "../_components/practice-filter";
import { practiceCardRank } from "../_lib/practice-card-rank";
import { practiceCardVisual } from "../_lib/practice-card-visual";
import {
  listedPracticeMenus,
  listedPracticeRanks,
  PRACTICE_CATEGORIES,
  practiceDescriptionKey,
  practiceHref,
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
  const items: readonly PracticeFilterItem[] = listedPracticeMenus().map(
    (practice) => ({
      key: practice.slug,
      rank: practice.rank,
      category: practice.category,
      card: (
        <PracticeCard
          visual={practiceCardVisual(practice.slug, t)}
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
    }),
  );

  return (
    <ContentContainer breadcrumb={[{ label: t("title") }]}>
      <PageTitle>{t("title")}</PageTitle>

      <div className="space-y-8">
        {/* 総合演習には見出しを付けない。バナー自身が名前を持っており、
            ここに h2 を足すと絞り込みの一覧に見出しが割り込む */}
        <ComprehensivePracticeBanner />

        <PracticeFilter
          items={items}
          filterLabel={t("filter.label")}
          listHeading={t("filter.listHeading")}
          optionGroups={[
            [{ label: t("filter.all") }],
            // 級の並びはレジストリの順（5級 → 4級 の学習順）。一覧の
            // 並びも学習順なので、選択肢だけ級位の数字順にはしない。
            // 昇級試験だけで完結する級（1級）は一覧に並ぶ練習を持たないため
            // 選択肢にも出ない
            listedPracticeRanks().map((rank) => ({
              filter: { kind: "rank" as const, value: rank },
              label: tRanks(`names.${rank}`),
            })),
            // 分野は 1 本のトグルに 6 つ並ぶため、見出しに使っていた
            // 「符の計算」ではなく短い名前を使う（狭い画面で折り返さない）
            PRACTICE_CATEGORIES.map((category) => ({
              filter: { kind: "category" as const, value: category },
              label: t(`categories.${category}.short`),
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
