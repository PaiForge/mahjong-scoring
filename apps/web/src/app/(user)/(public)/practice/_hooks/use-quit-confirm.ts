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
}

interface UseQuitConfirmReturn {
  readonly isQuitModalOpen: boolean;
  readonly handleQuitClick: () => void;
  readonly handleQuitCancel: () => void;
  readonly handleQuitConfirm: () => void;
}

/**
 * 途中でやめる確認モーダルの状態管理
 * ドリル中断確認
 *
 * モーダルの開閉状態と、確認・キャンセル時のコールバックを共通化する。
 */
export function useQuitConfirm({
  onOpen,
  onCancel: onCancelCallback,
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
    router.push("/practice");
  }, [tc, router]);

  return { isQuitModalOpen, handleQuitClick, handleQuitCancel, handleQuitConfirm };
}
