"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";
import { UserIcon } from "./icons/user-icon";
import { useAuth } from "@/app/_contexts/auth-context";

/**
 * ヘッダー右側のアカウント表示。
 * blindfold-chess の AuthStatusDisplay を移植。
 * 認証済み: アバター丸ボタン → ドロップダウン（マイページ/設定/ログアウト）。
 * 未認証: 新規登録 / ログイン のテキストリンク。
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
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  if (isLoading) {
    return (
      <div className="h-8 w-8 rounded-full bg-surface-200 animate-pulse" />
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-3 text-sm">
        <Link
          href="/sign-up"
          className="font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("signUp")}
        </Link>
        <Link
          href="/sign-in"
          className="font-medium text-link-primary transition-colors hover:opacity-80"
        >
          {t("login")}
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
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <UserIcon className="size-5" />
        </span>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg border border-border bg-card"
        >
          <Link
            href="/mypage"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-3 text-sm text-foreground transition-colors hover:bg-accent"
          >
            {t("mypage")}
          </Link>
          <Link
            href="/preferences"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-3 text-sm text-foreground transition-colors hover:bg-accent"
          >
            {t("settings")}
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="block w-full px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-accent"
          >
            {t("signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
