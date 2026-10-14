import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { SectionTitle } from "@/app/(user)/_components/section-title";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { RankSummaryCard } from "@/app/(user)/(public)/dojo/_components/rank-summary-card";
import {
  practiceListChapters,
  practiceListRanks,
  type PracticeListFilter,
} from "@mahjong-scoring/features/practice/list-guides";

import { PracticeChapterSection } from "./practice-chapter-section";

interface PracticeListGuidesProps {
  /** 一覧の絞り込み。undefined なら絞り込みなし */
  readonly filter: PracticeListFilter | undefined;
}

/**
 * 練習一覧の下に置くレッスンと段級位
 * 一覧のガイド
 *
 * Server Component。基礎練習の一覧の後ろに「関連するレッスン」と
 * 「関連する段級位」を並べる。中身は絞り込みに合わせて変わり、
 * 絞り込みが無ければ先頭だけを出す（決め方は features の `practiceListChapters` /
 * `practiceListRanks`）。どちらも末尾の中央に全体への導線（目次へ / 道場へ）を置く。
 *
 * レッスンは練習の説明ページの「関連するレッスン」と同じ部品
 * （{@link PracticeChapterSection}）、級は道場の級カードと同じ枠と見出しの
 * {@link RankSummaryCard} で出し、他の画面と同じ見た目にそろえる。
 *
 * 一覧の上ではなく下に置くのは、基礎練習と実戦練習を切り替えたときに
 * カードの始まる位置をずらさないため。
 */
export async function PracticeListGuides({ filter }: PracticeListGuidesProps) {
  const t = await getTranslations("practice");
  const ranks = practiceListRanks(filter);

  return (
    <div className="space-y-8">
      <PracticeChapterSection
        title={t("requiredKnowledge")}
        slugs={practiceListChapters(filter)}
        tocLinkAlign="center"
      />
      {ranks.length > 0 && (
        <section className="space-y-3">
          <SectionTitle>{t("relatedRanks")}</SectionTitle>
          <ol className="space-y-4">
            {ranks.map((rank) => (
              <li key={rank}>
                <RankSummaryCard rankSlug={rank} />
              </li>
            ))}
          </ol>
          <div className="text-center">
            <Link
              href="/dojo"
              className={`text-sm font-medium ${TEXT_LINK_CLASSES}`}
            >
              {t("modes.dojoLink")}
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
