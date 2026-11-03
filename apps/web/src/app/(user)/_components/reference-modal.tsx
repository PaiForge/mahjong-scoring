"use client";

import { useId } from "react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ModalShell } from "@/app/_components/modal-shell";
import { ModalCloseButton } from "@/app/(user)/_components/modal-close-button";

interface ReferenceModalProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  /** モーダルの見出し（参照先のページタイトル） */
  readonly title: string;
  /** 表示する参照コンテンツ */
  readonly children: ReactNode;
}

/**
 * 参照モーダル
 * 早見表モーダル
 *
 * 答え合わせやレッスンの本文から、いまの画面を離れずに早見表（点数表・
 * 役一覧）を確かめるための共通の器。見出し・閉じるボタン・スクロール枠の
 * 体裁だけを持ち、中身と開閉の制御は呼び出し側に任せる。
 */
export function ReferenceModal({
  isOpen,
  onClose,
  title,
  children,
}: ReferenceModalProps) {
  const tCommon = useTranslations("common");
  const titleId = useId();

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      labelledBy={titleId}
      widthClassName="max-w-2xl"
    >
      <div className="flex items-center justify-between">
        <h3 id={titleId} className="text-lg font-bold text-surface-900">
          {title}
        </h3>
        <ModalCloseButton onClick={onClose} label={tCommon("close")} />
      </div>
      <div className="max-h-[70vh] overflow-y-auto">{children}</div>
    </ModalShell>
  );
}
