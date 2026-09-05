import Link from "next/link";
import { BeltPill } from "@/app/(user)/_components/belt-pill";
import { BookIcon } from "@/app/(user)/_components/icons/book-icon";
import { ChevronRightIcon } from "@/app/(user)/_components/icons/chevron-right-icon";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import type { RankSlug } from "@/lib/ranks/registry";
import type { PracticeCardVisual as CardVisual } from "../_lib/practice-card-visual";
import { PracticeCardVisual } from "./practice-card-visual";

interface PracticeCardProps {
  /**
   * 「何を見て何を答えるか」を写した例示の帯。`practiceCardVisual()` で
   * 組み立てる。一覧に並ぶ練習はすべて持つ。
   *
   * 説明文を置かないのはこの帯があるため。「雀頭（アタマ）の牌種に応じた
   * 符を答える練習」は、練習名と帯が並んだ時点で読む必要が無くなる。
   */
  visual?: CardVisual;
  href: string;
  title: string;
  /**
   * その練習が身につける段級位。どの級の範囲にも入らない練習は undefined で、
   * ピルを出さない（「級なし」を表すラベルは出さない — 空白のままの方が、
   * 級を持つカードの側が読み取りやすい）。
   *
   * ピルは押せる。「この練習は4級のため」と名乗っておいて 4級 が何なのかを
   * 見に行けないと、ラベルが飾りになる。行き先は `rankExamHref`。
   */
  rank?: {
    readonly slug: RankSlug;
    readonly label: string;
    readonly href: string;
    /** リンクのアクセシブル名（「4級 昇級試験」） */
    readonly ariaLabel: string;
  };
  /** カードの行き先を表すリンクの文言（「くわしく見る」） */
  detailLabel: string;
  learnHref?: string;
  /** 教本アイコンのアクセシブル名（「教本を読む」）。アイコンに文字は添えない */
  learnLabel?: string;
}

export function PracticeCard({
  visual,
  href,
  title,
  rank,
  detailLabel,
  learnHref,
  learnLabel,
}: PracticeCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border-3 border-ink bg-white p-5 transition-transform hover:-translate-y-1">
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="flex items-center gap-1 text-base font-bold text-surface-900">
            {title}
            {learnHref && learnLabel && (
              // 教本は練習と並ぶ別の行き先ではなく、その練習名に付いている
              // 参照先。名前の隣にアイコンだけで置き、カードの下の導線は
              // 練習ページへの 1 本に保つ。文字を添えると、同じ重さの
              // 行き先が 2 つあるように読める
              <Link
                href={learnHref}
                aria-label={learnLabel}
                title={learnLabel}
                className="-m-1 rounded-md p-1 text-surface-400 transition-colors hover:text-surface-700"
              >
                <BookIcon className="size-5" />
              </Link>
            )}
          </h3>
          {rank && (
            <BeltPill
              slug={rank.slug}
              label={rank.label}
              href={rank.href}
              ariaLabel={rank.ariaLabel}
            />
          )}
        </div>
        {visual && <PracticeCardVisual visual={visual} />}
      </div>
      <div className="mt-4 flex justify-end">
        <Link
          href={href}
          className={`flex items-center text-sm font-bold ${TEXT_LINK_CLASSES}`}
        >
          {detailLabel}
          <ChevronRightIcon className="ml-1 size-4" />
        </Link>
      </div>
    </div>
  );
}
