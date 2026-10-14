/**
 * 練習一覧
 *
 * @description 基礎練習と実戦練習の入口。基礎練習は段級位・分野で絞り込み、
 * 実戦練習は問題のプレビューと利用枠を示す。選択は URL と端末に保存する。
 * @flow 各練習の設定・説明ページへ遷移する。
 */
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ContentContainer } from "@/app/(user)/_components/content-container";
import { NativeAdCard } from "@/app/(user)/(public)/_components/native-ad-card";
import { PageTitle } from "@/app/(user)/_components/page-title";
import { createNamespaceMetadata } from "@/app/_lib/metadata";
import { getNativeAdCreative } from "@/lib/ads/creatives";
import {
  AgariScorePracticeBanner,
  TenpaiScorePracticeBanner,
} from "../_components/practical-practice-banners";
import { PracticeModeSwitcher } from "../_components/practice-mode-switcher";
import { CatalogPracticeCard } from "../_components/catalog-practice-card";
import {
  PracticeFilter,
  type PracticeFilterGuide,
  type PracticeFilterItem,
} from "../_components/practice-filter";
import { PracticeListGuides } from "../_components/practice-list-guides";
import {
  listedPracticeMenus,
  PRACTICE_CATEGORIES,
} from "@mahjong-scoring/features/practice/catalog";
import type { PracticeListFilter } from "@mahjong-scoring/features/practice/list-guides";
import {
  listedPracticeRanks,
  practiceRanks,
} from "@mahjong-scoring/features/practice/rank-practices";

export async function generateMetadata(): Promise<Metadata> {
  return createNamespaceMetadata("practice", { path: "/practice" });
}

export default async function PracticePage() {
  const [t, tRanks, ad] = await Promise.all([
    getTranslations("practice"),
    getTranslations("ranks"),
    getNativeAdCreative("practice-grid-native-ad"),
  ]);

  // カードはここで全件描画し、絞り込みは表示するかどうかの判断だけを
  // クライアントに渡す（プリレンダーされた HTML に全カードが載るように）
  const items: readonly PracticeFilterItem[] = listedPracticeMenus().map(
    (practice) => ({
      key: practice.slug,
      ranks: practiceRanks(practice.slug),
      category: practice.category,
      card: <CatalogPracticeCard slug={practice.slug} />,
    }),
  );

  // 一覧の下のガイドは絞り込みの選択肢ごとに描いておき、選ばれた 1 つを
  // クライアントが出す（カードと同じく、サーバーで searchParams を読まない）
  const guideFilters: readonly (PracticeListFilter | undefined)[] = [
    undefined,
    ...listedPracticeRanks().map(
      (rank) => ({ kind: "rank", value: rank }) as const,
    ),
    ...PRACTICE_CATEGORIES.map(
      (category) => ({ kind: "category", value: category }) as const,
    ),
  ];
  const guides: readonly PracticeFilterGuide[] = guideFilters.map((filter) => ({
    filter,
    content: <PracticeListGuides filter={filter} />,
  }));

  return (
    <ContentContainer breadcrumb={[{ label: t("title") }]}>
      <PageTitle>{t("title")}</PageTitle>

      <PracticeModeSwitcher
        basic={
          <div className="space-y-6">
            <PracticeFilter
              items={items}
              filterLabel={t("filter.label")}
              listHeading={t("filter.listHeading")}
              adCard={ad && <NativeAdCard creative={ad} />}
              guides={guides}
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
          </div>
        }
        practical={
          <div className="grid gap-4 sm:grid-cols-2">
            <AgariScorePracticeBanner />
            <TenpaiScorePracticeBanner />
          </div>
        }
      />
    </ContentContainer>
  );
}
