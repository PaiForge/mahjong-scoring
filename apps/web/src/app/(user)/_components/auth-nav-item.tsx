"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { DeferredPrefetchLink } from "./deferred-prefetch-link";
import { UserIcon } from "./icons/user-icon";
import { UserAvatar } from "./user-avatar";
import { useAuth } from "@/app/_contexts/auth-context";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import {
  FOCUS_RING_CLASSES,
  TEXT_LINK_CLASSES,
} from "@/app/_components/_lib/link-classes";
import { toastOnArrival } from "@/app/_components/_lib/toast-on-arrival";

/**
 * ヘッダー右側のアカウント表示。
 * blindfold-chess の AuthStatusDisplay を移植。
 * 認証済み: アバター丸ボタン → ドロップダウン（マイページ/設定/ログアウト）。
 * アバターを設定していればその画像を、未設定ならユーザーアイコンを出す。
 * 設定済みの画像には枠を付けない。未設定時のアイコンは中身が線画で、
 * 枠が無いと背景に溶けるので細線の円で囲む。
 * 未認証: ログイン（テキストリンク）/ 新規登録（枠線のみのボタン）。
 * 同形のボタンを 2 つ並べるとセグメントに見えるため、押せる面は新規登録だけに絞る。
 * その新規登録も緑の塗りにはしない。ヘッダーは遷移の場であって
 * 登録の本命導線は LP ヒーローや結果画面の CTA が持つため、ここはアバター
 * （細線の円）と同じ重さに揃え、認証状態が変わっても右端の重量を一定に保つ。
 */
export function AuthNavItem() {
  const t = useTranslations("nav");
  const router = useRouter();
  const { user, isLoading, profile, isProfileLoading, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSignOut = useCallback(async () => {
    setIsOpen(false);
    await signOut();
    // トップに着いてから出す（ここで出すと表示時間が遷移の裏で減る）
    toastOnArrival("/", t("signOutSuccess"), "success");
    router.push("/");
  }, [signOut, t, router]);

  useEffect(() => {
    function handleMouseDown(event: MouseEvent) {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  // ログイン済みならプロフィール（アバター）が届くまでスケルトンを続ける。
  // 先にユーザーアイコンを出すと、アバター設定済みの人には毎回アイコン →
  // アバターの差し替わりが見えてしまう。
  // スケルトンは灰色の円だけで示す（ProblemListSkeleton と同じ理由）。
  // 実物の枠は border-box なので直径は変わらない。
  if (isLoading || (user && isProfileLoading)) {
    return <SkeletonBar radius="full" className="h-8 w-8" />;
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3 text-xs sm:gap-4 sm:text-sm">
        <DeferredPrefetchLink
          href="/sign-in"
          className={`font-medium whitespace-nowrap ${TEXT_LINK_CLASSES}`}
        >
          {t("login")}
        </DeferredPrefetchLink>
        <DeferredPrefetchLink
          href="/sign-up"
          className={`rounded-lg border border-panel bg-card px-2.5 py-1 font-bold whitespace-nowrap text-primary-700 transition-colors hover:border-primary-300 hover:bg-primary-50 sm:px-3 sm:py-1.5 ${FOCUS_RING_CLASSES}`}
        >
          {t("signUp")}
        </DeferredPrefetchLink>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className={`flex items-center justify-center rounded-full transition-opacity hover:opacity-80 ${FOCUS_RING_CLASSES}`}
        aria-label={t("account")}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        {profile?.avatarUrl ? (
          <UserAvatar
            avatarUrl={profile.avatarUrl}
            name={profile.name}
            size="sm"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-primary-300 bg-primary-50 text-foreground">
            <UserIcon className="size-5" />
          </span>
        )}
      </button>

      {/* メニューは閉じていても mount したままにする（invisible + inert）。
          閉じている間に unmount すると中の Link がプリフェッチされず、開いてすぐ
          クリックしたときにサーバ応答までスケルトンも出ない（無反応に見える）。
          visibility: hidden なら IntersectionObserver が発火するので、Link は
          ページの読み込みが落ち着いた時点（DeferredPrefetchLink）で遷移先
          （/mypage は loading 境界まで）を取得しておける。
          router.prefetch() で先読みする案は Next 16 の Segment Cache で Link 自身の
          プリフェッチと干渉し、開いて待ってから押しても遅くなったため採らない。 */}
      <div
        role="menu"
        inert={!isOpen}
        aria-hidden={!isOpen}
        className={`absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border border-panel bg-card shadow-lg ${isOpen ? "" : "invisible"}`}
      >
        <DeferredPrefetchLink
          href="/mypage"
          role="menuitem"
          onClick={() => setIsOpen(false)}
          className="block border-b border-surface-100 px-4 py-3 text-sm font-bold text-foreground transition-colors hover:bg-primary-50 focus-visible:bg-primary-50 focus-visible:outline-none"
        >
          {t("mypage")}
        </DeferredPrefetchLink>
        <DeferredPrefetchLink
          href="/preferences"
          role="menuitem"
          onClick={() => setIsOpen(false)}
          className="block border-b border-surface-100 px-4 py-3 text-sm font-bold text-foreground transition-colors hover:bg-primary-50 focus-visible:bg-primary-50 focus-visible:outline-none"
        >
          {t("settings")}
        </DeferredPrefetchLink>
        <button
          type="button"
          role="menuitem"
          onClick={handleSignOut}
          className="block w-full px-4 py-3 text-left text-sm font-bold text-foreground transition-colors hover:bg-primary-50 focus-visible:bg-primary-50 focus-visible:outline-none"
        >
          {t("signOut")}
        </button>
      </div>
    </div>
  );
}
