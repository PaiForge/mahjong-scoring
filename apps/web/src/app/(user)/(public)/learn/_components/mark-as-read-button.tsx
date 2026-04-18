"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "react-hot-toast";
import { ConfirmationModal } from "@/app/_components/confirmation-modal";
import { markChapterRead } from "../_actions/mark-chapter-read";
import { unmarkChapterRead } from "../_actions/unmark-chapter-read";

interface MarkAsReadButtonProps {
  /** 対象章のスラッグ */
  readonly slug: string;
  /** サーバーから取得した初期読了状態 */
  readonly initialRead: boolean;
}

/**
 * 章読了トグルボタン
 * 読了トグル
 *
 * - 未読状態: 「読了にする」ボタンを押下で即 {@link markChapterRead} を呼び出す
 * - 既読状態: 「読了を解除」ボタンを押下で確認モーダル表示 → 承認で {@link unmarkChapterRead} を呼び出す
 * - 楽観的 UI 更新 + エラー時ロールバック + 未認証時はサインインページへ誘導
 */
export function MarkAsReadButton({ slug, initialRead }: MarkAsReadButtonProps) {
  const t = useTranslations("learnCurriculum.chapter");
  const router = useRouter();
  const [isRead, setIsRead] = useState(initialRead);
  const [isPending, startTransition] = useTransition();
  const [isUnmarkConfirmOpen, setIsUnmarkConfirmOpen] = useState(false);

  const runToggle = (nextState: boolean) => {
    setIsRead(nextState);

    startTransition(async () => {
      const result = nextState
        ? await markChapterRead(slug)
        : await unmarkChapterRead(slug);

      // 未認証は「期待された no-op」として success: true + skipped: 'anonymous' が返る。
      // 楽観的 UI を巻き戻してサインインページへ誘導する。
      if (result.success && "skipped" in result && result.skipped === "anonymous") {
        setIsRead(!nextState);
        const redirectTo = encodeURIComponent(`/learn/${slug}`);
        router.push(`/sign-in?redirect=${redirectTo}`);
        return;
      }

      if (!result.success) {
        setIsRead(!nextState);
        toast.error(t("updateFailedToast"));
      }
    });
  };

  const handleToggle = () => {
    if (isRead) {
      setIsUnmarkConfirmOpen(true);
      return;
    }
    runToggle(true);
  };

  const handleUnmarkConfirmed = () => {
    setIsUnmarkConfirmOpen(false);
    runToggle(false);
  };

  const handleUnmarkCancel = () => {
    setIsUnmarkConfirmOpen(false);
  };

  const baseClass =
    "inline-flex items-center justify-center rounded-lg px-6 py-2.5 text-sm font-semibold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60";
  const variantClass = isRead
    ? "border border-surface-300 bg-white text-surface-700 hover:bg-surface-50"
    : "bg-primary-500 text-white hover:bg-primary-600";

  return (
    <>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isPending}
        aria-pressed={isRead}
        className={`${baseClass} ${variantClass}`}
      >
        {isRead ? t("unmarkAsReadCta") : t("markAsReadCta")}
      </button>
      <ConfirmationModal
        isOpen={isUnmarkConfirmOpen}
        title={t("unmarkConfirmTitle")}
        message={t("unmarkConfirmMessage")}
        confirmText={t("unmarkConfirmOk")}
        cancelText={t("unmarkConfirmCancel")}
        confirmVariant="warning"
        onConfirm={handleUnmarkConfirmed}
        onClose={handleUnmarkCancel}
      />
    </>
  );
}
