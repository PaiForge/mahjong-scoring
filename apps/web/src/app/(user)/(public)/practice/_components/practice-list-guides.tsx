import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { SectionTitle } from "@/app/(user)/_components/section-title";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { RankSummaryCard } from "@/app/(user)/(public)/dojo/_components/rank-summary-card";
import type { CurriculumChapterSlug } from "@mahjong-scoring/features/curriculum/registry";
import type { RankSlug } from "@mahjong-scoring/features/ranks/registry";

import { PracticeChapterSection } from "./practice-chapter-section";
import { DOJO_PATH } from "@mahjong-scoring/features/routes";

interface PracticeListGuidesProps {
  /** 並べるレッスン（カリキュラムの順）。0 件なら節ごと出さない */
  readonly chapters: readonly CurriculumChapterSlug[];
  /** 並べる段級位（学習順）。0 件なら節ごと出さない */
  readonly ranks: readonly RankSlug[];
}

/**
 * 練習一覧の下に置くレッスンと段級位
 * 一覧のガイド
 *
 * Server Component。基礎練習・実戦練習のカードの後ろに「関連するレッスン」と
 * 「関連する段級位」を並べる。中身は呼び出し側が features の
 * `list-guides` で決める（基礎練習は絞り込みに合わせて変わる）。どちらも末尾の
 * 中央に全体への導線（目次へ / 道場へ）を置く。
 *
 * レッスンは練習の説明ページの「関連するレッスン」と同じ部品
 * （{@link PracticeChapterSection}）、級は道場の級カードと同じ枠と見出しの
 * {@link RankSummaryCard} で出し、他の画面と同じ見た目にそろえる。
 *
 * 一覧の上ではなく下に置くのは、基礎練習と実戦練習を切り替えたときに
 * カードの始まる位置をずらさないため。
 */
export async function PracticeListGuides({
  chapters,
  ranks,
}: PracticeListGuidesProps) {
  const t = await getTranslations("practice");

  return (
    <div className="space-y-8">
      <PracticeChapterSection
        title={t("requiredKnowledge")}
        slugs={chapters}
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
              href={DOJO_PATH}
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
