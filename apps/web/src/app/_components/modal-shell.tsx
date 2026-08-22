"use client";

import { useBodyScrollLock } from "../_hooks/use-body-scroll-lock";
import { useEffect, useCallback } from "react";
import type { ReactNode } from "react";

interface ModalShellProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly children: ReactNode;
  /** aria-labelledby に渡す見出し要素の id */
  readonly labelledBy?: string;
  /** aria-describedby に渡す本文要素の id */
  readonly describedBy?: string;
  /** aria-label（labelledBy を使わない場合） */
  readonly label?: string;
  /**
   * パネル（白い箱）の体裁。既定はユーザー向け画面の骨格（太枠＋オフセット影）。
   * 管理画面のように別の見た目で使う場合はここで丸ごと差し替える。
   */
  readonly panelClassName?: string;
}

/** パネル体裁の既定値（ユーザー向け画面の骨格） */
const DEFAULT_PANEL_CLASS =
  "rounded-2xl border-4 border-ink bg-white p-6 shadow-lg";

/**
 * モーダル共通シェル
 * モーダルシェル
 *
 * オーバーレイ・中央寄せパネル・Escape キーでの閉鎖・背景スクロールロックを
 * 一元化する。コンテンツ（見出し・本文・ボタン行）は children で受け取る。
 */
export function ModalShell({
  isOpen,
  onClose,
  children,
  labelledBy,
  describedBy,
  label,
  panelClassName = DEFAULT_PANEL_CLASS,
}: ModalShellProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, handleKeyDown]);

  useBodyScrollLock(isOpen);

  if (!isOpen) return undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-label={label}
    >
      <div
        className={`mx-4 w-full max-w-md space-y-6 ${panelClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
