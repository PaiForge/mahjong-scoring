import { getTranslations } from "next-intl/server";

import { ContentContainer } from "@/app/(user)/_components/content-container";
import { PageTitlePlaceholder } from "@/app/(user)/_components/page-title";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { RANK_REGISTRY } from "@mahjong-scoring/features/ranks/registry";

/**
 * 段級位一覧の読み込み中スケルトン。
 *
 * 実体（`ranks/(list)/page.tsx`）の「リード文 → 級のカードの並び」を同じ順・
 * 同じ高さで模す。リード文と未ログイン時の案内は辞書から引いた実物を出す
 * （静的な文字列で、高さが折り返しで決まるため矩形では幅ごとに行数が
 * ずれる）。案内のリンクは文字だけを置く — フォールバックは初期 HTML に
 * 焼き込まれ、リンクにすると同じ行き先が本物より先に並ぶ。
 *
 * 形は未ログインの閲覧者に合わせている（道場のスケルトンと同じく、公開
 * ページの既定の姿）。カードは段級位レジストリの件数だけ並べる。
 */
export default async function Loading() {
  const [t, tRanks] = await Promise.all([
    getTranslations("dojo"),
    getTranslations("ranks"),
  ]);

  return (
    <ContentContainer
      breadcrumb={[
        { label: t("title"), href: "/dojo" },
        { label: t("ranksList.title") },
      ]}
    >
      <PageTitlePlaceholder width="w-32" />

      <div className="space-y-8">
        <div className="space-y-2">
          <p className="text-sm leading-relaxed text-surface-500">
            {t("ranksList.lead")}
          </p>
          <p className="text-sm leading-relaxed text-surface-500">
            {t("signInNote")} {t("signInLink")}
          </p>
        </div>

        {/* 実体の RankCard と同じ枠・余白の殻に、合格基準だけは実物の文字を
            置く。狭い画面では基準の長さで 1〜2 行に折り返し、カードの高さが
            級ごとに変わる（390px 幅で 118px / 138px を実測）ため、矩形の
            固定高では合わない。級名と状態は見出し・閲覧者に依るのでバーで受ける */}
        <ol className="space-y-4">
          {RANK_REGISTRY.map((rank) => (
            <li
              key={rank.slug}
              className="rounded-xl border-3 border-surface-100 bg-white p-4 sm:p-5"
            >
              <div className="flex items-center gap-3">
                <SkeletonBar radius="full" className="size-12" tone={100} />
                <div className="min-w-0 flex-1">
                  <SkeletonBar className="h-7 w-16" tone={100} />
                </div>
                <SkeletonBar radius="full" className="h-6 w-16" tone={100} />
              </div>
              <dl className="mt-3 flex gap-2 text-sm text-surface-700">
                <dt className="shrink-0 font-bold">
                  {tRanks("examCta.criterionLabel")}:
                </dt>
                <dd>{tRanks(`criteria.${rank.slug}`)}</dd>
              </dl>
            </li>
          ))}
        </ol>
      </div>
    </ContentContainer>
  );
}
