import { getTranslations } from "next-intl/server";
import Link from "next/link";

interface PaginationNavProps {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly buildHref: (page: number) => string;
}

/**
 * 汎用ページネーションナビゲーション
 *
 * totalPages が 1 以下の場合は何も描画しない。
 */
export async function PaginationNav({
  currentPage,
  totalPages,
  buildHref,
}: PaginationNavProps) {
  if (totalPages <= 1) {
    return undefined;
  }

  const t = await getTranslations("pagination");

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between mt-4"
    >
      <div className="text-sm text-surface-500">
        {t("pageIndicator", { current: currentPage, total: totalPages })}
      </div>
      <div className="flex gap-2">
        {currentPage > 1 ? (
          <Link
            href={buildHref(currentPage - 1)}
            className="px-4 py-2 text-sm rounded border border-surface-300 hover:bg-surface-100 transition-colors"
          >
            {t("previous")}
          </Link>
        ) : (
          <span className="px-4 py-2 text-sm rounded border border-surface-300 opacity-50 cursor-not-allowed">
            {t("previous")}
          </span>
        )}
        {currentPage < totalPages ? (
          <Link
            href={buildHref(currentPage + 1)}
            className="px-4 py-2 text-sm rounded border border-surface-300 hover:bg-surface-100 transition-colors"
          >
            {t("next")}
          </Link>
        ) : (
          <span className="px-4 py-2 text-sm rounded border border-surface-300 opacity-50 cursor-not-allowed">
            {t("next")}
          </span>
        )}
      </div>
    </nav>
  );
}
