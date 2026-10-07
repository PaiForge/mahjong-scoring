import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { adminButtonClasses } from "../_lib/button-classes";

interface AdminPaginationNavProps {
  readonly currentPage: number;
  readonly totalPages: number;
  readonly buildHref: (page: number) => string;
}

/**
 * 管理画面の一覧のページ送り。
 *
 * ユーザー向けの `PaginationNav` と同じ構成（ページ数 + 前へ / 次へ）で、
 * ボタンだけ管理画面の `adminButtonClasses()` で描く。ユーザー向けのものを
 * 共有すると、太枠のブランドボタンが管理画面の中で 1 か所だけ浮く。
 * totalPages が 1 以下の場合は何も描画しない。
 */
export async function AdminPaginationNav({
  currentPage,
  totalPages,
  buildHref,
}: AdminPaginationNavProps) {
  if (totalPages <= 1) {
    return undefined;
  }

  const t = await getTranslations("pagination");
  const buttonClasses = adminButtonClasses({ variant: "secondary" });

  const pageLink = (page: number, disabled: boolean, label: string) =>
    disabled ? (
      <span aria-disabled="true" className={`${buttonClasses} opacity-40`}>
        {label}
      </span>
    ) : (
      <Link href={buildHref(page)} className={buttonClasses}>
        {label}
      </Link>
    );

  return (
    <nav
      aria-label="Pagination"
      className="mt-4 flex items-center justify-between"
    >
      <p className="text-sm text-surface-500">
        {t("pageIndicator", { current: currentPage, total: totalPages })}
      </p>
      <div className="flex gap-2">
        {pageLink(
          Math.max(1, currentPage - 1),
          currentPage <= 1,
          t("previous"),
        )}
        {pageLink(
          Math.min(totalPages, currentPage + 1),
          currentPage >= totalPages,
          t("next"),
        )}
      </div>
    </nav>
  );
}
