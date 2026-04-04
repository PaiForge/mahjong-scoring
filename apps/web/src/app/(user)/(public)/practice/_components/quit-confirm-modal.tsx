"use client";

import { useTranslations } from "next-intl";
import { ConfirmationModal } from "@/app/_components/confirmation-modal";

interface QuitConfirmModalProps {
  readonly isOpen: boolean;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
}

/**
 * 途中でやめる確認モーダル
 *
 * ドリル中に「やめる」を押した際に表示する確認ダイアログ。
 * ConfirmationModal の薄いラッパーで、翻訳ラベルを注入する。
 */
export function QuitConfirmModal({
  isOpen,
  onConfirm,
  onCancel,
}: QuitConfirmModalProps) {
  const t = useTranslations("challenge.quit");

  return (
    <ConfirmationModal
      isOpen={isOpen}
      title={t("title")}
      message={t("message")}
      confirmText={t("confirm")}
      cancelText={t("cancel")}
      confirmVariant="danger"
      onConfirm={onConfirm}
      onClose={onCancel}
    />
  );
}
