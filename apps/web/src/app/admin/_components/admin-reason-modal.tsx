"use client";

import { useState, useTransition, type FormEvent, type ReactNode } from "react";

import { MODERATION_REASON_MAX_LENGTH } from "../users/_lib/moderation-reason";
import { AdminModalShell } from "./admin-modal-shell";
import { adminButtonClasses } from "../_lib/button-classes";
import { ADMIN_INPUT_CLASSES } from "../_lib/input-classes";

/** ボタンとモーダルに出す文言（翻訳済み） */
interface AdminReasonModalLabels {
  readonly trigger: string;
  readonly title: string;
  /** タイトル下の補足。無ければ出さない */
  readonly description?: string;
  readonly reasonLabel: string;
  readonly reasonPlaceholder: string;
  /** 理由が空のまま送ったときのエラー */
  readonly reasonRequired: string;
  /** 操作が失敗したときのエラー */
  readonly failed: string;
  readonly cancel: string;
  readonly confirm: string;
  readonly pending: string;
}

interface AdminReasonModalProps {
  readonly labels: AdminReasonModalLabels;
  /** 押す色。取り消し系は danger */
  readonly tone: "danger" | "primary";
  /** 理由欄の id。一覧の行ごとに描画されるものは対象で分ける */
  readonly reasonId: string;
  /**
   * 理由（前後の空白を除いたもの）を受けて操作を実行する。成功なら true。
   * 理由の上限はサーバー側（`normalizeModerationReason`）でも検証する
   */
  readonly onSubmit: (reason: string) => Promise<boolean>;
  /** 閉じたとき（成功・キャンセルとも）に追加の入力欄を戻す */
  readonly onReset?: () => void;
  /** 理由欄の前に置く追加の入力欄 */
  readonly children?: ReactNode;
}

/**
 * 理由を入力して実行する管理操作のボタンとモーダル
 * 理由入力モーダル
 *
 * BAN / 特典の付与 / 付与の取り消しで共通。理由は監査ログ
 * （`moderation_actions.reason`）に残るため必須。
 *
 * @design フォームの `action` ではなく `onSubmit` で送る
 * `<form action={fn}>` は、fn が終わると React がフォームをリセットする。入力エラーで
 * モーダルを開いたままにしても、`children` に置いた制御されたラジオ（付与の種別・期間）は
 * DOM の選択だけが初期値へ戻り、state と食い違って「選んだのに外れている」表示になる。
 * 入力欄は閉じるとき（`close`）にだけ自分で戻す。
 */
export function AdminReasonModal({
  labels,
  tone,
  reasonId,
  onSubmit,
  onReset,
  children,
}: AdminReasonModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");

  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();

  const close = () => {
    setIsOpen(false);
    setReason("");
    setError(undefined);
    onReset?.();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = reason.trim();
    if (trimmed.length === 0) {
      setError(labels.reasonRequired);
      return;
    }
    setError(undefined);
    startTransition(async () => {
      if (await onSubmit(trimmed)) {
        close();
      } else {
        setError(labels.failed);
      }
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={adminButtonClasses({ variant: tone, size: "sm" })}
      >
        {labels.trigger}
      </button>

      <AdminModalShell isOpen={isOpen} onClose={close} label={labels.title}>
        <h3 className="text-lg font-semibold">{labels.title}</h3>
        {labels.description && (
          <p className="text-sm text-surface-600">{labels.description}</p>
        )}

        <form onSubmit={handleSubmit}>
          {children}

          <label htmlFor={reasonId} className="mb-1 block text-sm font-medium">
            {labels.reasonLabel}
          </label>
          <textarea
            id={reasonId}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={labels.reasonPlaceholder}
            className={`mb-4 w-full ${ADMIN_INPUT_CLASSES}`}
            rows={3}
            maxLength={MODERATION_REASON_MAX_LENGTH}
          />

          {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={close}
              className={adminButtonClasses({ variant: "secondary" })}
            >
              {labels.cancel}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className={adminButtonClasses({ variant: tone })}
            >
              {isPending ? labels.pending : labels.confirm}
            </button>
          </div>
        </form>
      </AdminModalShell>
    </>
  );
}
