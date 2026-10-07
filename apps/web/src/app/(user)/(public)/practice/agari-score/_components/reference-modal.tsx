"use client";

import { useId } from "react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { ModalShell } from "@/app/_components/modal-shell";

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
 * 答え合わせから出題ループを離脱せずに早見表（点数表・役一覧）を確かめる
 * ための共通の器。見出し・閉じるボタン・スクロール枠の体裁だけを持ち、
 * 中身と開閉の制御は呼び出し側に任せる。
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
        <button
          type="button"
          onClick={onClose}
          aria-label={tCommon("close")}
          className="text-surface-400 transition-colors hover:text-surface-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5"
            aria-hidden
          >
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      </div>
      <div className="max-h-[70vh] overflow-y-auto">{children}</div>
    </ModalShell>
  );
}
