"use client";

import { useBodyScrollLock } from "../_hooks/use-body-scroll-lock";
import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import type { ReactNode } from "react";

import { useIsClient } from "../_hooks/use-is-client";

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
   * パネル（白い箱）の体裁。既定はユーザー向け画面の骨格（太枠）。
   * 管理画面のように別の見た目で使う場合はここで丸ごと差し替える。
   */
  readonly panelClassName?: string;
  /**
   * パネルの最大幅。既定はダイアログ向けの max-w-md。
   * 表など幅が要るコンテンツではここだけ差し替える。
   */
  readonly widthClassName?: string;
  /**
   * ポータル先（body 直下）へ持ち出すスキン。
   *
   * `data-skin="plain"` は管理画面のルート要素に付いているが、モーダルは
   * body へポータルするためその配下から抜ける。管理画面で開くモーダルは
   * ここで明示的に持ち出す。
   */
  readonly skin?: "plain";
}

/** パネル体裁の既定値（ユーザー向け画面の骨格） */
const DEFAULT_PANEL_CLASS = "rounded-2xl border-4 border-ink bg-white p-6";

/**
 * モーダル共通シェル
 * モーダルシェル
 *
 * オーバーレイ・中央寄せパネル・Escape キーでの閉鎖・背景スクロールロックを
 * 一元化する。コンテンツ（見出し・本文・ボタン行）は children で受け取る。
 *
 * 描画は `document.body` へポータルする。呼び出し元の位置に置いたままだと、
 * オーバーレイが `position: fixed` でも「その場所の兄弟要素」として扱われ、
 * 親の余白ユーティリティ（`space-y-*` は隣接する子に margin を付ける）が
 * そのまま乗る。`inset-0` と margin が両立できず高さが削られるため、
 * 画面下端に親の余白ぶんの隙間が空く。祖先に `transform` / `filter` が
 * 現れたときに fixed の基準がその祖先へ移る問題も同時に避けられる。
 */
export function ModalShell({
  isOpen,
  onClose,
  children,
  labelledBy,
  describedBy,
  label,
  panelClassName = DEFAULT_PANEL_CLASS,
  widthClassName = "max-w-md",
  skin,
}: ModalShellProps) {
  // ポータル先の document.body はサーバーには無いので、クライアントに乗るまで待つ。
  const isClient = useIsClient();

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

  if (!isOpen || !isClient) return undefined;

  return createPortal(
    <div
      data-skin={skin}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-label={label}
    >
      <div
        className={`mx-4 w-full space-y-6 ${widthClassName} ${panelClassName}`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}
