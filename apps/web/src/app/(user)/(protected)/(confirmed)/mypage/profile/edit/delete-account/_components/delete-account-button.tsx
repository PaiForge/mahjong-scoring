"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import { ConfirmationModal } from "@/app/_components/confirmation-modal";
import { useAuth } from "@/app/_contexts/auth-context";

/**
 * アカウント削除ボタン。確認モーダルを挟んで /api/account を呼び、ログアウトしてトップへ。
 * 退会ボタン
 */
export function DeleteAccountButton() {
  const t = useTranslations("deleteAccount");
  const router = useRouter();
  const { signOut } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsModalOpen(false);
    setIsDeleting(true);

    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (!res.ok) {
        toast.error(t("error"));
        setIsDeleting(false);
        return;
      }

      await signOut();
      toast.success(t("successToast"));
      router.push("/");
    } catch {
      toast.error(t("error"));
      setIsDeleting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        disabled={isDeleting}
        className="inline-flex items-center justify-center rounded-lg border border-red-300 px-5 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
      >
        {isDeleting ? t("deleting") : t("confirmButton")}
      </button>

      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirm}
        title={t("confirmTitle")}
        message={t("confirmMessage")}
        confirmText={t("confirmOk")}
        cancelText={t("confirmCancel")}
        confirmVariant="danger"
      />
    </>
  );
}
