"use client";

import { useEffect, useCallback, useId } from "react";

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
 * info-modal.tsx と同じビジュアルスタイルに合わせている。
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

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return undefined;

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={messageId}
    >
      <div
        className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id={titleId} className="mb-4 text-lg font-bold text-surface-900">
          {title}
        </h3>
        <p
          id={messageId}
          className="text-sm leading-relaxed text-surface-700"
        >
          {message}
        </p>
        <div className="mt-6 flex justify-end gap-3">
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
      </div>
    </div>
  );
}
