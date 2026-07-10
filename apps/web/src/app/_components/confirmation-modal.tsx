"use client";

import { useId } from "react";

import { ModalShell } from "./modal-shell";

interface ConfirmationModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly title: string;
  readonly message: string;
  readonly confirmText: string;
  readonly cancelText: string;
  readonly confirmVariant?: "danger" | "warning" | "primary";
}

/**
 * 確認モーダル
 *
 * 確認・キャンセルの2ボタンを持つ汎用モーダル。
 * シェル（オーバーレイ・Escape・スクロールロック）は ModalShell に委譲する。
 */
export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  confirmVariant = "primary",
}: ConfirmationModalProps) {
  const titleId = useId();
  const messageId = useId();

  const confirmColorClass = (() => {
    switch (confirmVariant) {
      case "danger":
        return "bg-red-500 hover:bg-red-600";
      case "warning":
        return "bg-amber-500 hover:bg-amber-600";
      case "primary":
        return "bg-primary-500 hover:bg-primary-600";
      default: {
        const _exhaustive: never = confirmVariant;
        return _exhaustive;
      }
    }
  })();

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      labelledBy={titleId}
      describedBy={messageId}
    >
      <h3 id={titleId} className="text-lg font-bold text-surface-900">
        {title}
      </h3>
      <p id={messageId} className="text-sm leading-relaxed text-surface-700">
        {message}
      </p>
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-surface-300 px-6 py-2 text-sm font-bold text-surface-700 transition-colors hover:bg-surface-100"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          autoFocus
          className={`rounded-lg px-6 py-2 text-sm font-bold text-white transition-colors ${confirmColorClass}`}
        >
          {confirmText}
        </button>
      </div>
    </ModalShell>
  );
}
