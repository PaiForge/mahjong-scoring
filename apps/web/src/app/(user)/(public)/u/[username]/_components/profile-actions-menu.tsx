"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import { EllipsisHorizontalIcon } from "@/app/(user)/_components/icons/ellipsis-horizontal-icon";
import { FOCUS_RING_CLASSES } from "@/app/_components/_lib/link-classes";

import { BlockConfirmDialog, type BlockConfirmLabels } from "./block-dialogs";
import { ReportDialog } from "./report-dialog";

/** {@link ProfileActionsMenu} の文言（`publicProfile` はサーバー専用の名前空間なので、ページが訳して渡す） */
export interface ProfileActionsMenuLabels extends BlockConfirmLabels {
  /** 「…」ボタンの aria-label */
  readonly menu: string;
  readonly block: string;
}

const MENU_ITEM_CLASSES =
  "block w-full px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-surface-100 focus-visible:bg-surface-100 focus-visible:outline-none";

/**
 * 公開プロフィールの「…」メニュー
 * プロフィール操作メニュー
 *
 * 通報とブロックを「…」の中に収める。どちらも他の利用者に向けたネガティブな
 * 操作で、プロフィールを開くたびに言葉として目に入らないようにするため、
 * 開くまでは無地の三点だけを見せる（X・GitHub のプロフィールと同じ形）。
 * 入口を消さないのは、web は他の利用者の自由入力（表示名・自己紹介・SNS・
 * アバター）を見せており、利用規約が通報とブロックを約束しているから。
 *
 * メニューの外を押すか Escape で閉じる。項目を選ぶとメニューを閉じて
 * それぞれの確認ダイアログを開く。
 */
export function ProfileActionsMenu({
  username,
  labels,
}: {
  readonly username: string;
  readonly labels: ProfileActionsMenuLabels;
}) {
  const t = useTranslations("report");
  const [isOpen, setIsOpen] = useState(false);
  const [dialog, setDialog] = useState<"report" | "block" | undefined>(
    undefined,
  );
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleMouseDown(event: MouseEvent) {
      if (
        containerRef.current &&
        event.target instanceof Node &&
        !containerRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const openDialog = (kind: "report" | "block") => {
    setIsOpen(false);
    setDialog(kind);
  };
  const closeDialog = () => setDialog(undefined);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={labels.menu}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex h-8 w-8 items-center justify-center rounded-full text-surface-400 transition-colors hover:bg-surface-100 hover:text-surface-600 ${FOCUS_RING_CLASSES}`}
      >
        <EllipsisHorizontalIcon />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-xl border border-panel bg-card shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => openDialog("report")}
            className={`${MENU_ITEM_CLASSES} border-b border-surface-100`}
          >
            {t("button")}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => openDialog("block")}
            className={MENU_ITEM_CLASSES}
          >
            {labels.block}
          </button>
        </div>
      )}

      <ReportDialog
        username={username}
        isOpen={dialog === "report"}
        onClose={closeDialog}
      />
      <BlockConfirmDialog
        username={username}
        labels={labels}
        isOpen={dialog === "block"}
        onClose={closeDialog}
      />
    </div>
  );
}
