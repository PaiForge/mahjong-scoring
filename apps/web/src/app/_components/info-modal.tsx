"use client";

import { ModalShell } from "./modal-shell";

interface InfoModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly closeLabel: string;
  readonly children: React.ReactNode;
}

/**
 * 情報表示モーダル
 *
 * 閉じるボタンのみを持つ汎用モーダル。
 * シェル（オーバーレイ・Escape・スクロールロック）は ModalShell に委譲する。
 */
export function InfoModal({
  isOpen,
  onClose,
  title,
  closeLabel,
  children,
}: InfoModalProps) {
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} label={title}>
      <h3 className="text-xl font-bold text-surface-900">{title}</h3>
      <div className="text-sm leading-relaxed text-surface-700">{children}</div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="press-sm rounded-lg border-3 border-ink bg-primary-500 px-6 py-2 text-sm font-bold text-white shadow-sm hover:bg-primary-600"
        >
          {closeLabel}
        </button>
      </div>
    </ModalShell>
  );
}
