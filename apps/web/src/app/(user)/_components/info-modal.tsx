"use client";

import type { ReactNode } from "react";

import { Button } from "./button";
import { XMarkIcon } from "./icons/x-mark-icon";
import { FOCUS_RING_CLASSES } from "@/app/_components/_lib/link-classes";
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
   *
   * 罫線で区切って出す。閉じるボタンより下にあるものが「押し忘れられた
   * 2 つ目のアクション」ではなく付録だと、位置だけでは伝わらないため。
   * 左寄せなのは、最も押される閉じるボタンの真下を空けておくため
   * （外したときに章から設定ページへ飛ばされるのは代償が大きい）。
   */
  readonly footnote?: ReactNode;
}

/**
 * 情報表示モーダル
 *
 * 閉じるボタンのみを持つ汎用モーダル。
 *
 * 閉じる操作は 2 つ置く。見出しの右の × は、モーダルの閉じ方として最も
 * 見慣れた位置で、本文が長くスクロールした後でも下まで降りずに閉じられる。
 * 下端の「閉じる」ボタンは読み終えた指の先にある出口で、初期フォーカスも
 * こちらに置く（× に置くとフォーカスリングが見出しの横に出て目を引く）。
 * どちらも同じ `closeLabel` を名乗り、× は aria-label で読ませる。
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
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl font-bold text-surface-900">{title}</h3>
        {/* 見出しの 1 行（text-xl）と中心を揃えつつ、タップ領域は 36px 取る。
            負の余白でパネルの角へ寄せ、見出しの位置は動かさない */}
        <button
          type="button"
          onClick={onClose}
          aria-label={closeLabel}
          className={`-mr-2 -mt-1 shrink-0 rounded-lg p-1.5 text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-900 ${FOCUS_RING_CLASSES}`}
        >
          <XMarkIcon className="size-6" />
        </button>
      </div>
      <div className="text-sm leading-relaxed text-surface-700">{children}</div>
      <div className="flex justify-end">
        <Button onClick={onClose} autoFocus>
          {closeLabel}
        </Button>
      </div>
      {footnote !== undefined && (
        <div className="border-t border-panel pt-4 text-xs">{footnote}</div>
      )}
    </ModalShell>
  );
}
