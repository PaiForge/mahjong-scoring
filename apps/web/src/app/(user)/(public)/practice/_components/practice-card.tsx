import Link from "next/link";
import { BeltPill } from "@/app/(user)/_components/belt-pill";
import { BookIcon } from "@/app/(user)/_components/icons/book-icon";
import { ChevronRightIcon } from "@/app/(user)/_components/icons/chevron-right-icon";
import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import type { PracticeMenuSlug } from "@/lib/db/practice-menu-types";
import type { RankSlug } from "@/lib/ranks/registry";
import { PracticeCardVisual } from "./practice-card-visual";

interface PracticeCardProps {
  /** どの練習のカードか。例示牌をこれで引く（{@link PracticeCardVisual}） */
  slug: PracticeMenuSlug;
  href: string;
  title: string;
  description: string;
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
  startLabel: string;
  learnHref?: string;
  learnLabel?: string;
}

export function PracticeCard({
  slug,
  href,
  title,
  description,
  rank,
  startLabel,
  learnHref,
  learnLabel,
}: PracticeCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border-3 border-ink bg-white p-5 transition-transform hover:-translate-y-1">
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-bold text-surface-900">{title}</h3>
          {rank && (
            <BeltPill
              slug={rank.slug}
              label={rank.label}
              href={rank.href}
              ariaLabel={rank.ariaLabel}
            />
          )}
        </div>
        <p className="mt-2 text-sm font-medium text-surface-500">
          {description}
        </p>
        <PracticeCardVisual slug={slug} />
      </div>
      <div className="mt-4 flex items-center justify-between">
        <Link
          href={href}
          className={`flex items-center text-sm font-bold ${TEXT_LINK_CLASSES}`}
        >
          {startLabel}
          <ChevronRightIcon className="ml-1 size-4" />
        </Link>
        {learnHref && learnLabel && (
          <Link
            href={learnHref}
            className={`flex items-center gap-1 text-sm ${TEXT_LINK_CLASSES}`}
          >
            <BookIcon className="size-4" />
            {learnLabel}
          </Link>
        )}
      </div>
    </div>
  );
}
