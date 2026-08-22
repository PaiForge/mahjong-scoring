"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";
import { UserIcon } from "./icons/user-icon";
import { useAuth } from "@/app/_contexts/auth-context";
import { SkeletonBar } from "@/app/_components/skeleton-bar";
import { TEXT_LINK_MUTED_CLASSES } from "./_lib/link-classes";

/**
 * ヘッダー右側のアカウント表示。
 * blindfold-chess の AuthStatusDisplay を移植。
 * 認証済み: アバター丸ボタン → ドロップダウン（マイページ/設定/ログアウト）。
 * 未認証: ログイン（テキストリンク）/ 新規登録（プライマリボタン）。
 * 同形のボタンを 2 つ並べるとセグメントに見えるため、一次導線の新規登録だけを
 * ボタンにして、ログインはテキストリンクに落とす。
 */
export function AuthNavItem() {
  const t = useTranslations("nav");
  const router = useRouter();
  const { user, isLoading, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSignOut = useCallback(async () => {
    setIsOpen(false);
    await signOut();
    toast.success(t("signOutSuccess"));
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

  if (isLoading) {
    return (
      <SkeletonBar radius="full" className="h-8 w-8 border-3 border-ink" />
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3 text-xs sm:gap-4 sm:text-sm">
        <Link
          href="/sign-in"
          className={`font-medium whitespace-nowrap ${TEXT_LINK_MUTED_CLASSES}`}
        >
          {t("login")}
        </Link>
        <Link
          href="/sign-up"
          className="press-sm rounded-lg border-3 border-ink bg-primary-500 px-2.5 py-1 font-bold whitespace-nowrap text-white shadow-xs hover:bg-primary-600 sm:px-3 sm:py-1.5"
        >
          {t("signUp")}
        </Link>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className="flex items-center justify-center rounded-full transition-opacity hover:opacity-80"
        aria-label={t("account")}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full border-3 border-ink bg-primary-50 text-foreground">
          <UserIcon className="size-5" />
        </span>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-xl border-3 border-ink bg-card shadow-sm"
        >
          <Link
            href="/mypage"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="block border-b-2 border-dashed border-border/40 px-4 py-3 text-sm font-bold text-foreground transition-colors hover:bg-primary-50"
          >
            {t("mypage")}
          </Link>
          <Link
            href="/preferences"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="block border-b-2 border-dashed border-border/40 px-4 py-3 text-sm font-bold text-foreground transition-colors hover:bg-primary-50"
          >
            {t("settings")}
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="block w-full px-4 py-3 text-left text-sm font-bold text-foreground transition-colors hover:bg-primary-50"
          >
            {t("signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
