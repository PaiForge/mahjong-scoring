"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";
import { UserIcon } from "./icons/user-icon";
import { useAuth } from "@/app/_contexts/auth-context";

interface AuthNavItemProps {
  readonly className?: string;
  readonly iconClassName?: string;
  readonly skeletonIconClassName?: string;
  readonly skeletonTextClassName?: string;
  /** ドロップダウンメニューの展開方向。サイドバー下部は "top"、ヘッダーは "bottom" */
  readonly menuPlacement?: "top" | "bottom";
}

export function AuthNavItem({
  className,
  iconClassName,
  skeletonIconClassName,
  skeletonTextClassName,
  menuPlacement = "bottom",
}: AuthNavItemProps) {
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
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  if (isLoading) {
    return (
      <div className={className}>
        <div className={`rounded-full bg-surface-200 animate-pulse ${skeletonIconClassName ?? ""}`} />
        <div className={`rounded bg-surface-200 animate-pulse ${skeletonTextClassName ?? ""}`} />
      </div>
    );
  }

  if (!user) {
    return (
      <Link href="/sign-in" className={className}>
        <UserIcon className={iconClassName} />
        {t("login")}
      </Link>
    );
  }

  // サイドバー(top)は全幅ボタンに合わせて左右いっぱい、
  // ヘッダー(bottom)は右寄せで最小幅を確保する。
  const menuPositionClass =
    menuPlacement === "top"
      ? "bottom-full mb-2 left-0 right-0"
      : "top-full mt-2 right-0 min-w-[12rem]";

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`${className ?? ""} w-full`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <UserIcon className={iconClassName} />
        {t("mypage")}
      </button>

      {isOpen && (
        <div
          role="menu"
          className={`absolute z-50 ${menuPositionClass} overflow-hidden rounded-lg border border-surface-200 bg-white shadow-lg`}
        >
          <Link
            href="/mypage"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2.5 text-sm text-surface-700 transition-colors hover:bg-surface-100"
          >
            {t("mypage")}
          </Link>
          <Link
            href="/mypage/settings"
            role="menuitem"
            onClick={() => setIsOpen(false)}
            className="block px-4 py-2.5 text-sm text-surface-700 transition-colors hover:bg-surface-100"
          >
            {t("settings")}
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={handleSignOut}
            className="block w-full px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-surface-100"
          >
            {t("signOut")}
          </button>
        </div>
      )}
    </div>
  );
}
