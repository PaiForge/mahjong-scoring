"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";

import {
  getBlockedUsersAction,
  unblockUserAction,
  type BlockedUserView,
} from "@/app/(user)/_actions/blocks";
import { Button } from "@/app/(user)/_components/button";
import { SettingsCard } from "@/app/(user)/_components/setting-toggle-row";
import { UserAvatar } from "@/app/(user)/_components/user-avatar";
import {
  FOCUS_RING_CLASSES,
  ROW_LINK_TITLE_CLASSES,
} from "@/app/_components/_lib/link-classes";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { useAuth } from "@/app/_contexts/auth-context";

/**
 * 設定の「ブロックしたユーザー」
 * ブロック一覧セクション
 *
 * ブロックした人を新しい順に並べ、その場で解除させる。ブロックは公開
 * プロフィールのボタンからしかできないので、ここに「追加」は無い。
 * ランキング非表示の設定（`PrivacySettingsSection`）と同じく、ページを
 * 静的に保つため一覧は描画後に Server Action から取る。
 */
export function BlockedUsersSection() {
  const t = useTranslations("settings");
  const { user, isLoading: isAuthLoading } = useAuth();
  const [users, setUsers] = useState<
    readonly BlockedUserView[] | "failed" | undefined
  >(undefined);
  const [, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    if (!isAuthLoading && user) {
      void getBlockedUsersAction().then((rows) => {
        if (!cancelled) setUsers(rows ?? "failed");
      });
    }
    return () => {
      cancelled = true;
    };
  }, [user, isAuthLoading]);

  const unblock = (username: string) => {
    if (!Array.isArray(users)) return;
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
      {users === undefined ? (
        // 未ログインはゲートが覆うので、読み込み中と同じ帯で高さだけ保つ
        <div className="px-5 py-4">
          <SkeletonBar className="h-5 w-40" tone={100} />
        </div>
      ) : users === "failed" ? (
        <p className="px-5 py-4 text-sm text-surface-500">
          {t("blockedUsersLoadFailed")}
        </p>
      ) : users.length === 0 ? (
        <p className="px-5 py-4 text-sm text-surface-500">
          {t("blockedUsersEmpty")}
        </p>
      ) : (
        <ul className="divide-y divide-surface-100">
          {users.map((row) => {
            const name = row.displayName ?? row.username;
            return (
              <li
                key={row.username}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <Link
                  href={`/u/${row.username}`}
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
                    </span>
                  </span>
                </Link>
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
      )}
    </SettingsCard>
  );
}
