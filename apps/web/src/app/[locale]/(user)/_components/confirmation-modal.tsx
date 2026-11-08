"use client";

import { useId } from "react";

import { Button } from "./button";
import { ModalShell } from "@/app/_components/modal-shell";

interface ConfirmationModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onConfirm: () => void;
  readonly title: string;
  /** 見出しだけで足りるときは省く。無い注意書きを埋めるための文は置かない */
  readonly message?: string;
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

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      labelledBy={titleId}
      describedBy={message === undefined ? undefined : messageId}
    >
      <h3 id={titleId} className="text-xl font-bold text-surface-900">
        {title}
      </h3>
      {message !== undefined && (
        <p id={messageId} className="text-sm leading-relaxed text-surface-700">
          {message}
        </p>
      )}
      <div className="flex justify-end gap-3">
        <Button variant="neutral" onClick={onClose}>
          {cancelText}
        </Button>
        <Button variant={confirmVariant} onClick={onConfirm} autoFocus>
          {confirmText}
        </Button>
      </div>
    </ModalShell>
  );
}
