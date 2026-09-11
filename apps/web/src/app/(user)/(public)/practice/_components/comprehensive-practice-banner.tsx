import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { ChevronRightIcon } from "@/app/(user)/_components/icons/chevron-right-icon";

import {
  COMPREHENSIVE_PRACTICE_HREF,
  MACHI_SCORE_PRACTICE_HREF,
} from "../_lib/practice-catalog";

interface EndlessPracticeBannerProps {
  readonly href: string;
  /** 練習を表す絵文字（装飾。読み上げには載せない） */
  readonly emoji: string;
  readonly title: string;
  readonly description: string;
}

/**
 * 終わりのない練習（記録を取らない訓練）への導線バナー
 * 訓練バナー
 *
 * 制限時間もミス上限もなく好きなだけ解ける訓練は練習カードにせず、
 * 一覧の先頭にこのバナーで置く。カード全体がリンクなので押せる面の記号
 * （太枠 + 影 + 押し込み）を持つ。
 */
function EndlessPracticeBanner({
  href,
  emoji,
  title,
  description,
}: EndlessPracticeBannerProps) {
  return (
    <Link
      href={href}
      className="press-sm flex items-center gap-4 rounded-2xl border-3 border-ink bg-white p-6 shadow-sm hover:bg-primary-50"
    >
      <span className="text-3xl" aria-hidden="true">
        {emoji}
      </span>
      <div className="flex-1">
        <h3 className="text-base font-bold text-surface-900">{title}</h3>
        <p className="mt-1 text-sm font-medium text-surface-500">
          {description}
        </p>
      </div>
      <ChevronRightIcon className="size-5 shrink-0 text-surface-400" />
    </Link>
  );
}

/**
 * 点数計算総合演習（`/practice/score`）への導線バナー
 * 総合演習バナー
 *
 * 練習一覧の先頭と、ダッシュボードで他に勧めるものが無くなったときの
 * フォールバックで共有する。
 */
export async function ComprehensivePracticeBanner() {
  const t = await getTranslations("practice");

  return (
    <EndlessPracticeBanner
      href={COMPREHENSIVE_PRACTICE_HREF}
      emoji="♾️"
      title={t("comprehensiveBanner.title")}
      description={t("comprehensiveBanner.description")}
    />
  );
}

/**
 * 待ち別点数計算（`/practice/machi-score`）への導線バナー
 * 待ち別点数計算バナー
 *
 * 総合演習の隣に置く、もう 1 つの終わりのない訓練。
 */
export async function MachiScorePracticeBanner() {
  const t = await getTranslations("practice");

  return (
    <EndlessPracticeBanner
      href={MACHI_SCORE_PRACTICE_HREF}
      emoji="🀄"
      title={t("machiScoreBanner.title")}
      description={t("machiScoreBanner.description")}
    />
  );
}
