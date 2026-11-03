"use client";

import { XMarkIcon } from "./icons/x-mark-icon";
import { FOCUS_RING_CLASSES } from "@/app/_components/_lib/link-classes";

interface ModalCloseButtonProps {
  readonly onClick: () => void;
  /** aria-label（「閉じる」）。× だけでは読み上げに名前が無い */
  readonly label: string;
}

/**
 * モーダルの見出しの右に置く × の閉じるボタン
 * モーダル閉じるボタン
 *
 * モーダルの閉じ方として最も見慣れた位置の出口。本文が長くスクロールした
 * 後でも、下端のボタンまで降りずに閉じられる。説明・早見表・ヘルプツアー・
 * 選択肢の一覧のように「閉じても何も失わない」モーダルに置き、モーダル
 * ごとに × の形を書き起こさない（以前は塗りの小さい × と線画の × が
 * 混在していた）。
 *
 * 確認モーダル（キャンセル / 確定）と入力を持つダイアログ（通報）には
 * 置かない。× がキャンセルなのか分かりにくく、入力途中の文章がひと押しで
 * 消えるため、明示のボタンだけで閉じさせる。
 *
 * 見出しと同じ行の右端に置く。タップ領域は 36px 取り、負の余白で
 * パネルの角へ寄せて見出しの位置を動かさない。線と色はナビのドロワーの
 * × と同じ灰色の線画。
 */
export function ModalCloseButton({ onClick, label }: ModalCloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`-my-1.5 -mr-1.5 shrink-0 rounded-lg p-1.5 text-surface-500 transition-colors hover:bg-surface-100 hover:text-surface-900 ${FOCUS_RING_CLASSES}`}
    >
      <XMarkIcon className="size-6" />
    </button>
  );
}
