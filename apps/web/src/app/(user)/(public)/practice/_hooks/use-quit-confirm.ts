"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";

interface UseQuitConfirmOptions {
  /** モーダルを開いたときに呼ばれるコールバック（タイマー一時停止等） */
  readonly onOpen?: () => void;
  /** モーダルをキャンセルで閉じたときに呼ばれるコールバック（タイマー再開等） */
  readonly onCancel?: () => void;
  /**
   * 「やめる」確定時の遷移先（既定: "/practice"）。
   * 説明ページを持つ練習では各練習の説明ページ（例: "/practice/jantou-fu"）を渡し、
   * トレーニングの「終了」と同じく元の説明ページへ戻す。
   */
  readonly exitHref?: string;
}

interface UseQuitConfirmReturn {
  readonly isQuitModalOpen: boolean;
  readonly handleQuitClick: () => void;
  readonly handleQuitCancel: () => void;
  readonly handleQuitConfirm: () => void;
}

/**
 * 途中でやめる確認モーダルの状態管理
 * 練習中断確認
 *
 * モーダルの開閉状態と、確認・キャンセル時のコールバックを共通化する。
 */
export function useQuitConfirm({
  onOpen,
  onCancel: onCancelCallback,
  exitHref = "/practice",
}: UseQuitConfirmOptions = {}): UseQuitConfirmReturn {
  const tc = useTranslations("challenge");
  const router = useRouter();
  const [isQuitModalOpen, setIsQuitModalOpen] = useState(false);

  const handleQuitClick = useCallback(() => {
    setIsQuitModalOpen(true);
    onOpen?.();
  }, [onOpen]);

  const handleQuitCancel = useCallback(() => {
    setIsQuitModalOpen(false);
    onCancelCallback?.();
  }, [onCancelCallback]);

  const handleQuitConfirm = useCallback(() => {
    setIsQuitModalOpen(false);
    toast(tc("quit.toast"));
    router.push(exitHref);
  }, [tc, router, exitHref]);

  return { isQuitModalOpen, handleQuitClick, handleQuitCancel, handleQuitConfirm };
}
