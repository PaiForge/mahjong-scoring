"use client";

import { useId } from "react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ModalShell } from "@/app/_components/modal-shell";
import { ModalCloseButton } from "@/app/[locale]/(user)/_components/modal-close-button";

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
 *
 * スクロール枠は下に `pb-2` の余白を持つ。テキストリンクの下線は文字から
 * 4px 下（`underline-offset-4`）に引かれ、行の箱の外にはみ出す。中身の最後の
 * 行がリンクだと（点数表の脚注の「設定を変更」）、余白が無いと `overflow-y-auto`
 * の枠が下線を切り落とし、リンクがただの文字に見えた。
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
      <div className="max-h-[70vh] overflow-y-auto pb-2">{children}</div>
    </ModalShell>
  );
}
