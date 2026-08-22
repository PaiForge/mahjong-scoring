import Link from "next/link";
import { getTranslations } from "next-intl/server";

import { ChevronRightIcon } from "@/app/(user)/_components/icons/chevron-right-icon";

import { COMPREHENSIVE_PRACTICE_HREF } from "../_lib/practice-catalog";

/**
 * 点数計算総合演習（`/practice/score`）への導線バナー
 * 総合演習バナー
 *
 * 制限時間もミス上限もなく好きなだけ解ける訓練で、練習メニューの中では
 * 唯一の「終わりがない」入口。練習一覧の先頭と、ダッシュボードで他に勧める
 * ものが無くなったときのフォールバックで共有する。
 */
export async function ComprehensivePracticeBanner() {
  const t = await getTranslations("practice");

  return (
    <Link
      href={COMPREHENSIVE_PRACTICE_HREF}
      className="press-sm flex items-center gap-4 rounded-2xl border-3 border-ink bg-white p-6 shadow-sm hover:bg-primary-50"
    >
      <span className="text-3xl" aria-hidden="true">
        ♾️
      </span>
      <div className="flex-1">
        <h3 className="text-base font-bold text-surface-900">
          {t("comprehensiveBanner.title")}
        </h3>
        <p className="mt-1 text-sm font-medium text-surface-500">
          {t("comprehensiveBanner.description")}
        </p>
      </div>
      <ChevronRightIcon className="size-5 shrink-0 text-surface-400" />
    </Link>
  );
}
