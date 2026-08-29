"use client";

import type { ReactNode } from "react";

import { Button } from "./button";
import { ModalShell } from "@/app/_components/modal-shell";

interface InfoModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly title: string;
  readonly closeLabel: string;
  readonly children: React.ReactNode;
  /**
   * 閉じるボタンの下に置く補足。本文でも主要動作でもない出口
   * （設定への導線など）を、閉じるボタンより前に割り込ませないための場所。
   */
  readonly footnote?: ReactNode;
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
  footnote,
}: InfoModalProps) {
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} label={title}>
      <h3 className="text-xl font-bold text-surface-900">{title}</h3>
      <div className="text-sm leading-relaxed text-surface-700">{children}</div>
      <div className="flex justify-end">
        <Button onClick={onClose} autoFocus>
          {closeLabel}
        </Button>
      </div>
      {footnote !== undefined && <div className="text-xs">{footnote}</div>}
    </ModalShell>
  );
}
