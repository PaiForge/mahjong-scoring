import { getTranslations } from "next-intl/server";

import { LinkButton } from "./link-button";

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
        <LinkButton
          href={buildHref(Math.max(1, currentPage - 1))}
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1}
        >
          {t("previous")}
        </LinkButton>
        <LinkButton
          href={buildHref(Math.min(totalPages, currentPage + 1))}
          variant="secondary"
          size="sm"
          disabled={currentPage >= totalPages}
        >
          {t("next")}
        </LinkButton>
      </div>
    </nav>
  );
}
