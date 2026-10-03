import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { BeltBadge } from "@/app/(user)/_components/belt-badge";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { beltBorderClass } from "@/lib/ranks/belt-colors";
import type { RankStatus } from "@mahjong-scoring/features/ranks/rank-status";
import type { RankSlug } from "@mahjong-scoring/features/ranks/registry";
import { rankHref } from "@mahjong-scoring/features/routes";

import { RankStatusBadge } from "./rank-status-badge";

interface RankCardProps {
  readonly slug: RankSlug;
  readonly status: RankStatus;
}

/**
 * 段級位一覧の 1 件
 * 段級位カード
 *
 * Server Component。帯バッジ・級名・取得状態・合格基準を 1 枚に載せる。
 *
 * 枠は帯色。昇級試験カード（`ExamCtaCard`）と同じ理由で、級を掲げたカードに
 * 既定の ink（緑）を回すと緑がその級の色に見えてしまう。
 *
 * カード全体をリンクにせず、級名だけをテキストリンクにする。行き先の詳細
 * ページは読みに行くだけの場所で、太枠 + ハードシャドウ + 押し込みの
 * 「押して始める面」を着せると、試験や練習のカードと同じ重みに見える。
 * 影を持たない表示用のカードに、下線付きの級名を置く。
 */
export async function RankCard({ slug, status }: RankCardProps) {
  const t = await getTranslations("ranks");

  return (
    <article
      data-belt-slug={slug}
      className={`rounded-xl border-3 bg-white p-4 sm:p-5 ${beltBorderClass(slug)}`}
    >
      <div className="flex items-center gap-3">
        <BeltBadge slug={slug} />
        <h2 className="min-w-0 flex-1 text-lg font-bold">
          <Link href={rankHref(slug)} className={TEXT_LINK_CLASSES}>
            {t(`names.${slug}`)}
          </Link>
        </h2>
        <RankStatusBadge status={status} />
      </div>
      <dl className="mt-3 flex gap-2 text-sm text-surface-700">
        <dt className="shrink-0 font-bold">{t("examCta.criterionLabel")}:</dt>
        <dd>{t(`criteria.${slug}`)}</dd>
      </dl>
    </article>
  );
}
