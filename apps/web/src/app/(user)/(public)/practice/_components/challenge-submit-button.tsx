"use client";

import type { ReactNode } from "react";

/**
 * チャレンジモード送信ボタンの props
 * チャレンジ送信ボタン
 */
interface ChallengeSubmitButtonProps {
  /** ボタンが無効かどうか */
  readonly disabled: boolean;
  /** クリック時のコールバック */
  readonly onClick: () => void;
  /** ボタンラベル */
  readonly children: ReactNode;
}

/**
 * チャレンジモード共通の送信ボタン
 * チャレンジ送信ボタン
 *
 * 有効/無効状態に応じてスタイルが切り替わる。
 */
export function ChallengeSubmitButton({
  disabled,
  onClick,
  children,
}: ChallengeSubmitButtonProps) {
  return (
    <div className="mt-4">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className={`w-full rounded-lg py-3 text-sm font-semibold text-white shadow-sm transition-colors ${
          disabled
            ? "cursor-not-allowed bg-surface-300"
            : "bg-primary-500 hover:bg-primary-600"
        }`}
      >
        {children}
      </button>
    </div>
  );
}
