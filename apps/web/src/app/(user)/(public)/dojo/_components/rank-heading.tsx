import Link from "next/link";

import { BeltBadge } from "@/app/(user)/_components/belt-badge";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import type { RankStatus } from "@mahjong-scoring/features/ranks/rank-status";
import type { RankSlug } from "@mahjong-scoring/features/ranks/registry";
import { rankHref } from "@mahjong-scoring/features/routes";

import { RankStatusBadge } from "../ranks/_components/rank-status-badge";

interface RankHeadingProps {
  readonly rankSlug: RankSlug;
  readonly status: RankStatus;
  /** `ranks` 名前空間の翻訳関数（呼び出し側が引いたものを渡す） */
  readonly tRanks: (
    key: string,
    values?: Record<string, string | number>,
  ) => string;
  /** `dojo` 名前空間の翻訳関数（呼び出し側が引いたものを渡す） */
  readonly tDojo: (key: string) => string;
  /** スポットライトツアーが照らす対象の id */
  readonly dataTourId?: string;
}

/**
 * 級カードの見出し行
 * 段級位見出し
 *
 * 帯バッジ・「5級 — 満貫以上の点数計算ができること」・取得状態の pill を
 * 1 行に並べる。ダッシュボードの「次にやること」と道場の級カードが同じ形で
 * 出す — 同じ級を指すカードの頭が場所ごとに違うと、同じものに見えない。
 * 級名と合格基準をつなげた 1 文は級の詳細ページへのリンクにする。
 *
 * 以前はダッシュボードが「次の目標」を小さな文字のラベルで、道場が
 * 「できるようになること:」を級名の下の別の行で出していた。状態は pill
 * （道場の形）に、級名と基準は 1 文（ダッシュボードの形）に揃えた。
 *
 * 呼び出し側のテストが async なサーバーコンポーネントを 1 段だけ await して
 * 描画するため、翻訳関数は受け取って同期で描く。
 */
export function RankHeading({
  rankSlug,
  status,
  tRanks,
  tDojo,
  dataTourId,
}: RankHeadingProps) {
  return (
    <div className="flex items-center gap-3" data-tour-id={dataTourId}>
      <BeltBadge slug={rankSlug} />
      <h3 className="min-w-0 flex-1 text-base font-bold text-surface-900">
        <Link href={rankHref(rankSlug)} className={TEXT_LINK_CLASSES}>
          {tRanks("heading", {
            rank: tRanks(`names.${rankSlug}`),
            criterion: tRanks(`criteria.${rankSlug}`),
          })}
        </Link>
      </h3>
      <RankStatusBadge status={status} tDojo={tDojo} />
    </div>
  );
}
