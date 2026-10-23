"use client";

import type { ReactNode } from "react";

import { Button } from "@/app/(user)/_components/button";
import { useTrainingMode } from "@mahjong-scoring/features/practice/use-training-mode";

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
 *
 * トレーニングで回答後に停止している間は描かない。シェルが盤面の直下に
 * 「次の問題へ」を出すため、無効化した送信ボタンと二段に並ぶのを避ける
 * （引っ込んだ場所には答え合わせの資料の面が入る）。
 */
export function ChallengeSubmitButton({
  disabled,
  onClick,
  children,
}: ChallengeSubmitButtonProps) {
  const { isHolding } = useTrainingMode();
  if (isHolding) return undefined;

  return (
    <div className="mt-4">
      <Button size="lg" fullWidth onClick={onClick} disabled={disabled}>
        {children}
      </Button>
    </div>
  );
}
