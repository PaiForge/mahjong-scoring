"use client";

import { useState } from "react";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import { localizedHref } from "@/i18n/public-path";

import { toastOnArrival } from "@/app/_components/_lib/toast-on-arrival";
import { Button } from "@/app/[locale]/(user)/_components/button";
import { ConfirmationModal } from "@/app/[locale]/(user)/_components/confirmation-modal";
import { useAuth } from "@/app/_contexts/auth-context";
import { deleteOwnAccount } from "../_actions/delete-account";

/**
 * アカウント削除ボタン。確認モーダルを挟んで退会アクションを呼び、ログアウトしてトップへ。
 * 退会ボタン
 *
 * 退会後の行き先は同じ言語のトップ（`localizedHref("/", locale)`。日本語は `/`、
 * 英語は `/en`）。ログアウト・登録完了と同じ扱いで、英語で退会した人を日本語の
 * LP へ落とさない。トップは英語でも出している。
 */
export function DeleteAccountButton() {
  const locale = useLocale();
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
    // トップに着いてから出す（ここで出すと表示時間が遷移の裏で減る）。
    // 工程が残っている（pending）ときは完了と言わず、受け付けたことを伝える。
    // 着地の判定はロケール接頭辞を外したパスで比べるので、預ける側は "/" のまま
    toastOnArrival(
      "/",
      result.status === "completed" ? t("successToast") : t("acceptedToast"),
      "success",
    );
    router.push(localizedHref("/", locale));
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
