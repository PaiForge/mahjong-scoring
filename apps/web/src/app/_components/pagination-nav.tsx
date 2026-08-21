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
            className="press-sm rounded-lg border-3 border-ink bg-card px-4 py-2 text-sm shadow-sm hover:bg-primary-50"
          >
            {t("previous")}
          </Link>
        ) : (
          <span className="cursor-not-allowed rounded-lg border-3 border-ink px-4 py-2 text-sm opacity-40">
            {t("previous")}
          </span>
        )}
        {currentPage < totalPages ? (
          <Link
            href={buildHref(currentPage + 1)}
            className="press-sm rounded-lg border-3 border-ink bg-card px-4 py-2 text-sm shadow-sm hover:bg-primary-50"
          >
            {t("next")}
          </Link>
        ) : (
          <span className="cursor-not-allowed rounded-lg border-3 border-ink px-4 py-2 text-sm opacity-40">
            {t("next")}
          </span>
        )}
      </div>
    </nav>
  );
}
