"use client";

import { useTranslations } from "next-intl";
import { ConfirmationModal } from "@/app/(user)/_components/confirmation-modal";

interface QuitConfirmModalProps {
  readonly isOpen: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  /** 中断する対象。見出しの文言を選ぶ（チャレンジ / 試験） */
  readonly variant?: "practice" | "exam";
}

/**
 * 途中でやめる確認モーダル
 *
 * チャレンジ・試験の最中に「中止する」を押した際に表示する確認ダイアログ。
 * ConfirmationModal の薄いラッパーで、翻訳ラベルを注入する。
 */
export function QuitConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
  variant = "practice",
}: QuitConfirmModalProps) {
  const t = useTranslations("challenge.quit");

  return (
    <ConfirmationModal
      isOpen={isOpen}
      title={t(`${variant}.title`)}
      message={t("message")}
      confirmText={t("confirm")}
      cancelText={t("cancel")}
      confirmVariant="danger"
      onConfirm={onConfirm}
      onClose={onCancel}
    />
  );
}
