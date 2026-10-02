"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { useAuth } from "@/app/_contexts/auth-context";
import { FOCUS_RING_CLASSES } from "@/app/_components/_lib/link-classes";
import { NOTIFICATIONS_READ_EVENT } from "@/lib/notifications/read-event";

import { BellIcon } from "./icons/bell-icon";

/** これを超える未読数は「99+」にまとめる（バッジが横に伸びないように） */
const MAX_BADGE_COUNT = 99;

/**
 * ヘッダーのベル（未読の通知の件数つき）
 * 通知ベル
 *
 * 本登録済みのユーザーにだけ出す。未読数はプロフィールの応答（`/api/profile/me`）に
 * 載って届くので、ベルを置くための往復は無い。取り直すのは通知ページで既読に
 * したとき（`NOTIFICATIONS_READ_EVENT`）だけ — ユーザーがその数字を見ている
 * 瞬間なので往復に値する。それ以外は意図して古いままにする。ページ遷移ごとに
 * 取り直すと、1 日に数回しか動かない数字のために全遷移で DB を叩くことになる。
 * 届いた通知はページを読み直したとき（次のサインイン・リロード）に見える。
 *
 * 未読が無いときもベルは出す（ある時だけ出ると「通知の場所」が覚えられない）。
 * 位置はアバターの左。アバターと同じ 32px の円に収め、右端の重さを揃える。
 */
export function NotificationBell() {
  const t = useTranslations("notifications");
  const { user, profile, refreshProfile } = useAuth();

  useEffect(() => {
    function handleRead() {
      void refreshProfile();
    }
    window.addEventListener(NOTIFICATIONS_READ_EVENT, handleRead);
    return () =>
      window.removeEventListener(NOTIFICATIONS_READ_EVENT, handleRead);
  }, [refreshProfile]);

  // プロフィールが届くまでは出さない（アバターと同時に現れる）。
  // 未ログイン・仮登録（プロフィール無し）には通知ページ自体が無い
  if (!user || !profile) return undefined;

  const count = profile.unreadNotificationCount;
  const label = count > 0 ? t("bellUnread", { count }) : t("bell");

  return (
    // 押す頻度が低い導線なので viewport でのプリフェッチは切る。通知ページは
    // 動的で、ヘッダーに常にあるベルを毎ページ先読みするとその分サーバーを叩く
    <Link
      href="/mypage/notifications"
      prefetch={false}
      aria-label={label}
      title={label}
      className={`relative flex size-8 items-center justify-center rounded-full text-foreground transition-colors hover:bg-primary-50 ${FOCUS_RING_CLASSES}`}
    >
      <BellIcon className="size-5" />
      {count > 0 && (
        <span
          aria-hidden="true"
          className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold leading-none text-destructive-foreground tabular-nums"
        >
          {count > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : count}
        </span>
      )}
    </Link>
  );
}
