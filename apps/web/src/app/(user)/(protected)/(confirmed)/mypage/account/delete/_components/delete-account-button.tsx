"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import { toastOnArrival } from "@/app/_components/_lib/toast-on-arrival";
import { Button } from "@/app/(user)/_components/button";
import { ConfirmationModal } from "@/app/(user)/_components/confirmation-modal";
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
        result.error === "rateLimited"
          ? t("rateLimited")
          : result.error === "banned"
            ? t("banned")
            : t("error"),
      );
      setIsDeleting(false);
      return;
    }

    await signOut();
    // トップに着いてから出す（ここで出すと表示時間が遷移の裏で減る）
    toastOnArrival("/", t("successToast"), "success");
    router.push("/");
  };

  return (
    <>
      <Button
        variant="dangerOutline"
        size="lg"
        fullWidth
        onClick={() => setIsModalOpen(true)}
        disabled={isDeleting}
      >
        {isDeleting ? t("deleting") : t("confirmButton")}
      </Button>

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
