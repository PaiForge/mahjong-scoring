"use client";

import { useEffect, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "react-hot-toast";

import {
  getBlockedUsersAction,
  unblockUserAction,
  type BlockedUserView,
} from "@/app/[locale]/(user)/_actions/blocks";
import { Button } from "@/app/[locale]/(user)/_components/button";
import { SettingsCard } from "@/app/[locale]/(user)/_components/setting-toggle-row";
import { UserAvatar } from "@/app/[locale]/(user)/_components/user-avatar";
import {
  FOCUS_RING_CLASSES,
  ROW_LINK_TITLE_CLASSES,
} from "@/app/_components/_lib/link-classes";
import { useAuth } from "@/app/_contexts/auth-context";
import { publicProfileHref } from "@/lib/users/public-profile-href";
import {
  JapaneseOnlyMark,
  LocaleNavLink,
} from "@/app/[locale]/(user)/_components/locale-nav-link";
import { localizedHref } from "@/i18n/public-path";

/**
 * 公開プロフィールへのリンクの張り方（ページがサーバーで決めて渡す）
 *
 * この部品はクライアントで描かれるので公開状態を読まない。公開プロフィールの
 * 公開状態は `/u/<username>` の形で一律なので、ページが 1 回だけ引いて渡す。
 */
export interface PublicProfileLinks {
  /**
   * ページの言語で公開プロフィールを出していない（日本語のページへ言語を
   * またいで張り、「日本語のみ」の印を添える）
   */
  readonly crossLocale: boolean;
  /** 「日本語のみ」の印の文言（`nav.language.japaneseOnly`） */
  readonly japaneseOnlyLabel: string;
}

/**
 * 設定の「ブロックしたユーザー」
 * ブロック一覧セクション
 *
 * ブロックした人を新しい順に並べ、その場で解除させる。ブロックは公開
 * プロフィールの「…」メニューからしかできないので、ここに「追加」は無い。
 * ランキング非表示の設定（`PrivacySettingsSection`）と同じく、ページを
 * 静的に保つため一覧は描画後に Server Action から取る。
 *
 * ブロックした人が 1 人もいなければ（読み込み中・読み込みに失敗したときも）
 * 何も描かない。ブロックはネガティブな機能で、使ったことの無い人に設定の
 * たびに見せる理由が無いため。ページの末尾にあるので、後から現れても
 * 上の項目は動かない。読み込みに失敗しても、公開プロフィールのブロック中の
 * 案内から 1 人ずつ解除できる。
 *
 * 英語のページでもこの一覧は出し、ブロックした人の表示名もそのまま出す。
 * 他の利用者を見せる画面（ランキング・公開プロフィール）は英語で出さないが、
 * ここに並ぶのは本人がブロックを選んだ相手だけで、隠すと英語の画面から解除
 * できなくなるため。各行の公開プロフィールへのリンクは、英語のページからは
 * 日本語のページへ言語をまたいで張り（素の `<a hrefLang="ja">`）、「日本語のみ」の
 * 印を添える（`profileLinks`）。
 *
 * @param profileLinks - 公開プロフィールへのリンクの張り方
 */
export function BlockedUsersSection({
  profileLinks,
}: {
  readonly profileLinks: PublicProfileLinks;
}) {
  const locale = useLocale();
  const t = useTranslations("settings");
  const { user, isLoading: isAuthLoading } = useAuth();
  const [users, setUsers] = useState<readonly BlockedUserView[]>([]);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    if (!isAuthLoading && user) {
      void getBlockedUsersAction().then((rows) => {
        if (!cancelled) setUsers(rows ?? []);
      });
    }
    return () => {
      cancelled = true;
    };
  }, [user, isAuthLoading]);

  const unblock = (username: string) => {
    const previous = users;
    setUsers(previous.filter((row) => row.username !== username));
    startTransition(async () => {
      const result = await unblockUserAction(username);
      if ("error" in result) {
        setUsers(previous);
        toast.error(t("unblockFailedToast"));
        return;
      }
      toast.success(t("unblockedToast", { username }));
    });
  };

  if (users.length === 0) return null;

  return (
    <SettingsCard>
      <div className="px-5 py-4">
        <span className="block text-sm font-medium text-surface-900">
          {t("blockedUsersTitle")}
        </span>
        <span className="mt-0.5 block text-xs text-surface-500">
          {t("blockedUsersDescription")}
        </span>
      </div>
      <ul className="divide-y divide-surface-100">
        {users.map((row) => {
          const name = row.displayName ?? row.username;
          return (
            <li
              key={row.username}
              className="flex items-center justify-between gap-3 px-5 py-3"
            >
              <LocaleNavLink
                navTarget={{
                  href: profileLinks.crossLocale
                    ? publicProfileHref(row.username)
                    : localizedHref(publicProfileHref(row.username), locale),
                  crossLocale: profileLinks.crossLocale,
                }}
                linkKind="plain"
                className={`group flex min-w-0 items-center gap-3 rounded-md ${FOCUS_RING_CLASSES}`}
              >
                <UserAvatar avatarUrl={row.avatarUrl} name={name} size="sm" />
                <span className="min-w-0">
                  <span
                    className={`block truncate text-sm ${ROW_LINK_TITLE_CLASSES}`}
                  >
                    {name}
                  </span>
                  <span className="block truncate text-xs text-surface-500">
                    @{row.username}
                    {profileLinks.crossLocale && (
                      <JapaneseOnlyMark
                        label={profileLinks.japaneseOnlyLabel}
                      />
                    )}
                  </span>
                </span>
              </LocaleNavLink>
              <Button
                variant="neutral"
                size="sm"
                onClick={() => unblock(row.username)}
              >
                {t("unblock")}
              </Button>
            </li>
          );
        })}
      </ul>
    </SettingsCard>
  );
}
