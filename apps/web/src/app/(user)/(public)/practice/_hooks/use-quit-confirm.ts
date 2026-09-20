"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toastOnArrival } from "@/app/_components/_lib/toast-on-arrival";

interface UseQuitConfirmOptions {
  /** モーダルを開いたときに呼ばれるコールバック（タイマー一時停止等） */
  readonly onOpen?: () => void;
  /** モーダルをキャンセルで閉じたときに呼ばれるコールバック（タイマー再開等） */
  readonly onCancel?: () => void;
  /**
   * 「やめる」確定時の遷移先（練習の説明ページ）を返す。
   *
   * 文字列ではなく関数で受けるのは、確定の瞬間に今の URL の出題設定
   * （バリアント）を読んで説明ページの URL に載せるため — 描画時に固定すると、
   * サーバーでは URL を読めず既定の設定で戻すリンクになる。
   */
  readonly resolveExitHref: () => string;
  /**
   * 中断する対象。トーストの文言を選ぶ（チャレンジ / 試験）。
   * モーダルの見出しも同じ区別で出し分けるため、{@link
   * import("../_components/quit-confirm-modal").QuitConfirmModal} にも同じ値を渡すこと。
   */
  readonly variant?: "practice" | "exam";
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
  resolveExitHref,
  variant = "practice",
}: UseQuitConfirmOptions): UseQuitConfirmReturn {
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
    const exitHref = resolveExitHref();
    // 遷移先に着いてから出す。ここで出すと表示時間が遷移の裏で減り、
    // 視線も切り替わる本文側にあるため見落とされる
    toastOnArrival(exitHref, tc(`quit.${variant}.toast`));
    router.push(exitHref);
  }, [tc, router, resolveExitHref, variant]);

  return {
    isQuitModalOpen,
    handleQuitClick,
    handleQuitCancel,
    handleQuitConfirm,
  };
}
