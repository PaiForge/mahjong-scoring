"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import { ConfirmationModal } from "@/app/_components/confirmation-modal";
import { useAuth } from "@/app/_contexts/auth-context";
import { deleteOwnAccount } from "../_actions/delete-account";

/**
 * アカウント削除ボタン。確認モーダルを挟んで退会アクションを呼び、ログアウトしてトップへ。
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

    const result = await deleteOwnAccount();
    if ("error" in result) {
      toast.error(
        result.error === "rateLimited" ? t("rateLimited") : t("error"),
      );
      setIsDeleting(false);
      return;
    }

    await signOut();
    toast.success(t("successToast"));
    router.push("/");
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        disabled={isDeleting}
        className="press-sm inline-flex items-center justify-center rounded-lg border-3 border-destructive bg-white px-5 py-2 text-sm font-bold text-destructive shadow-sm hover:bg-destructive-subtle disabled:opacity-50"
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
