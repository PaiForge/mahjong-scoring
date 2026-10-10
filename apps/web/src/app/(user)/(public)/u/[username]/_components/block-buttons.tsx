"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import {
  blockUserAction,
  unblockUserAction,
} from "@/app/(user)/_actions/blocks";
import { Button } from "@/app/(user)/_components/button";
import { ConfirmationModal } from "@/app/(user)/_components/confirmation-modal";

/** {@link BlockButton} の文言（`publicProfile` は辞書をクライアントに渡さないので、ページが訳して渡す） */
export interface BlockButtonLabels {
  readonly block: string;
  readonly confirmTitle: string;
  readonly confirmMessage: string;
  readonly confirm: string;
  readonly cancel: string;
  readonly blockedToast: string;
  readonly failedToast: string;
}

/**
 * 公開プロフィールの「ブロックする」
 * ブロックボタン
 *
 * 押すと何が起きるか（相手に通知されない・設定から解除できる）を確認の
 * ダイアログで読ませてから書く。済んだらページを描き直し、ブロック中の
 * 案内に切り替わる。
 */
export function BlockButton({
  username,
  labels,
}: {
  readonly username: string;
  readonly labels: BlockButtonLabels;
}) {
  const router = useRouter();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isPending, startTransition] = useTransition();

  const confirm = () => {
    setIsConfirming(false);
    startTransition(async () => {
      const result = await blockUserAction(username);
      if ("error" in result) {
        toast.error(labels.failedToast);
        return;
      }
      toast.success(labels.blockedToast);
      router.refresh();
    });
  };

  return (
    <>
      <Button
        variant="neutral"
        size="sm"
        onClick={() => setIsConfirming(true)}
        disabled={isPending}
      >
        {labels.block}
      </Button>
      <ConfirmationModal
        isOpen={isConfirming}
        onClose={() => setIsConfirming(false)}
        onConfirm={confirm}
        title={labels.confirmTitle}
        message={labels.confirmMessage}
        confirmText={labels.confirm}
        cancelText={labels.cancel}
        confirmVariant="danger"
      />
    </>
  );
}

/** {@link UnblockButton} の文言 */
export interface UnblockButtonLabels {
  readonly unblock: string;
  readonly unblockedToast: string;
  readonly failedToast: string;
}

/**
 * ブロック中のプロフィールの「ブロックを解除」
 * ブロック解除ボタン
 *
 * 解除は取り返しのつく操作なので確認を挟まない。
 */
export function UnblockButton({
  username,
  labels,
}: {
  readonly username: string;
  readonly labels: UnblockButtonLabels;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const unblock = () => {
    startTransition(async () => {
      const result = await unblockUserAction(username);
      if ("error" in result) {
        toast.error(labels.failedToast);
        return;
      }
      toast.success(labels.unblockedToast);
      router.refresh();
    });
  };

  return (
    <Button variant="neutral" size="sm" onClick={unblock} disabled={isPending}>
      {labels.unblock}
    </Button>
  );
}
