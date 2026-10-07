import { getTranslations } from "next-intl/server";
import Link from "next/link";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";
import { adminButtonClasses } from "../../_lib/button-classes";

interface UserSearchFormProps {
  /** 現在の検索文字列（trim 済み） */
  readonly query: string;
  /** 検索に合致した件数。検索していないときは表示しない */
  readonly totalCount: number;
}

/**
 * ユーザー一覧の検索フォーム
 * ユーザー検索フォーム
 *
 * GET フォームなので送信すると `?user=` だけの URL になり、ページ番号は 1 に戻る。
 * 入力中に検索しない（送信で確定する）— 1 回の検索で全認証ユーザーを辿るため。
 * パラメータ名はログ画面の「ユーザーで絞り込み」と揃えている。
 */
export async function UserSearchForm({
  query,
  totalCount,
}: UserSearchFormProps) {
  const t = await getTranslations("admin.usersTable");

  return (
    <div className="admin-filter space-y-2">
      <form role="search" className="flex flex-wrap items-end gap-4">
        <div className="min-w-0 max-w-full">
          <label
            htmlFor="user-search"
            className="mb-1 block text-sm font-medium"
          >
            {t("search")}
          </label>
          <input
            id="user-search"
            name="user"
            type="search"
            defaultValue={query}
            placeholder={t("searchPlaceholder")}
            className="w-72 max-w-full rounded border border-surface-300 bg-white px-3 py-2 text-sm"
          />
        </div>
        <button type="submit" className={adminButtonClasses()}>
          {t("searchButton")}
        </button>
      </form>
      {query && (
        <p className="flex flex-wrap gap-x-3 text-sm text-surface-500">
          <span>{t("searchResultCount", { query, count: totalCount })}</span>
          <Link href="/admin/users" className={TEXT_LINK_CLASSES}>
            {t("clearSearch")}
          </Link>
        </p>
      )}
    </div>
  );
}
