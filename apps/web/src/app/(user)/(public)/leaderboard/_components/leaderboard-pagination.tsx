"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

import { LinkButton } from "@/app/(user)/_components/link-button";

import { buildPageItems } from "../_lib/page-items";

interface LeaderboardPaginationProps {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly totalCount: number;
}

function buildPageHref(pathname: string, page: number): string {
  if (page <= 1) return pathname;
  return `${pathname}?page=${page}`;
}

/**
 * リーダーボードページネーション
 * ランキングのページ切り替え
 */
export function LeaderboardPagination({
  currentPage,
  totalPages,
  totalCount,
}: LeaderboardPaginationProps) {
  const t = useTranslations("leaderboard");
  const pathname = usePathname();

  if (totalPages <= 1) return undefined;

  const pages = buildPageItems(currentPage, totalPages);

  return (
    <nav
      aria-label={t("pagination.label")}
      className="flex items-center justify-between mt-6"
    >
      <p className="text-sm text-surface-400">
        {t("pagination.total", { count: totalCount })}
      </p>
      <div className="flex items-center gap-1">
        <LinkButton
          href={buildPageHref(pathname, Math.max(1, currentPage - 1))}
          variant="secondary"
          size="sm"
          disabled={currentPage <= 1}
          aria-label={t("pagination.previous")}
        >
          {t("pagination.previous")}
        </LinkButton>

        {pages.map((page, i) =>
          page === "ellipsis" ? (
            <span
              key={`ellipsis-${i}`}
              className="px-2 py-2 text-sm text-surface-400"
            >
              ...
            </span>
          ) : (
            <Link
              key={page}
              href={buildPageHref(pathname, page)}
              aria-current={currentPage === page ? "page" : undefined}
              className={`min-w-[36px] px-2 py-2 text-sm rounded-md border transition-colors text-center ${
                currentPage === page
                  ? "border-primary-700 bg-primary-700 text-white font-bold"
                  : "border-panel text-surface-600 hover:bg-surface-50 hover:text-foreground"
              }`}
            >
              {page}
            </Link>
          ),
        )}

        <LinkButton
          href={buildPageHref(pathname, Math.min(totalPages, currentPage + 1))}
          variant="secondary"
          size="sm"
          disabled={currentPage >= totalPages}
          aria-label={t("pagination.next")}
        >
          {t("pagination.next")}
        </LinkButton>
      </div>
    </nav>
  );
}
