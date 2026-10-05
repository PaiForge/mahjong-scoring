import { getTranslations } from "next-intl/server";

import { TEXT_LINK_CLASSES } from "@/app/_components/_lib/link-classes";

interface PublicProfileLinkProps {
  readonly username: string;
}

/**
 * 管理画面のユーザー一覧から公開プロフィール（`/u/<username>`）へのリンク
 * 公開プロフィールリンク
 *
 * 新しいタブで開く — 一覧で作業している途中に調べ物をしに行く導線で、
 * 一覧から離れたいわけではないため。管理画面の外へ出るのはこのリンクだけ
 * なので、外部リンクの矢印でそれを示す。
 *
 * 公開プロフィールは BAN 済み・退会済みのユーザーを 404 にするため、
 * 呼び出し側は有効なユーザーにだけこれを使う。
 */
export async function PublicProfileLink({ username }: PublicProfileLinkProps) {
  const t = await getTranslations("admin");

  return (
    <a
      href={`/u/${encodeURIComponent(username)}`}
      target="_blank"
      rel="noopener noreferrer"
      title={t("usersTable.openPublicProfile")}
      className={`inline-flex items-center gap-1 ${TEXT_LINK_CLASSES}`}
    >
      {username}
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3 w-3 shrink-0"
        aria-hidden="true"
      >
        <path d="M14 4h6v6" />
        <path d="M20 4l-9 9" />
        <path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
      </svg>
    </a>
  );
}
