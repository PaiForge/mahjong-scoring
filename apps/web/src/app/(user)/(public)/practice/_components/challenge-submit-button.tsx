"use client";

import type { ReactNode } from "react";

import { Button } from "@/app/_components/button";

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
      <Button size="lg" fullWidth onClick={onClick} disabled={disabled}>
        {children}
      </Button>
    </div>
  );
}
