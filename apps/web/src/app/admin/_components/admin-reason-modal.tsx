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
  /**
   * 理由が空のまま送ったときのエラー。渡さなければ理由は任意で、空のまま送れる
   * （`onSubmit` には空文字が渡る）
   */
  readonly reasonRequired?: string;
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
   * 理由（前後の空白を除いたもの。任意で未入力なら空文字）を受けて操作を実行する。成功なら true。
   * 理由の上限はサーバー側（`normalizeModerationReason`）でも検証する
   */
  readonly onSubmit: (reason: string) => Promise<boolean>;
  /** 閉じたとき（成功・キャンセルとも）に追加の入力欄を戻す */
  readonly onReset?: () => void;
  /** 理由欄の前に置く追加の入力欄 */
  readonly children?: ReactNode;
  /**
   * 幅。既定は理由だけを入れる小さなダイアログ。追加の入力欄（`children`）が
   * 多いものは `wide` にする
   */
  readonly size?: "narrow" | "wide";
}

const WIDTH_CLASSES = { narrow: "max-w-md", wide: "max-w-2xl" } as const;

/**
 * 理由を入力して実行する管理操作のボタンとモーダル
 * 理由入力モーダル
 *
 * BAN / 特典の付与 / 付与の取り消しで共通。理由は監査ログ
 * （`moderation_actions.reason`）に残る。必須かどうかは `labels.reasonRequired` の
 * 有無で決まり、付与だけが任意（種別が「なぜ」を持つため。`grant-benefits.ts`）。
 *
 * 見出し・本文・操作の 3 段に分け、本文だけをスクロールさせる。入力欄が増えて
 * 画面の高さを超えても、確定とキャンセルが常に見えるように。
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
  size = "narrow",
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
    if (labels.reasonRequired !== undefined && trimmed.length === 0) {
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

      <AdminModalShell
        isOpen={isOpen}
        onClose={close}
        label={labels.title}
        layout="sectioned"
        widthClassName={WIDTH_CLASSES[size]}
      >
        <header className="border-b border-surface-200 px-6 py-4">
          <h3 className="text-lg font-semibold text-surface-900">
            {labels.title}
          </h3>
          {labels.description && (
            <p className="mt-1 text-sm text-surface-600">
              {labels.description}
            </p>
          )}
        </header>

        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-5">
            {children}

            <div>
              <label
                htmlFor={reasonId}
                className="mb-1.5 block text-sm font-medium text-surface-900"
              >
                {labels.reasonLabel}
              </label>
              <textarea
                id={reasonId}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={labels.reasonPlaceholder}
                aria-invalid={
                  labels.reasonRequired !== undefined &&
                  error === labels.reasonRequired
                }
                className={`w-full ${ADMIN_INPUT_CLASSES}`}
                rows={3}
                maxLength={MODERATION_REASON_MAX_LENGTH}
              />
            </div>
          </div>

          <footer className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2 border-t border-surface-200 bg-surface-50 px-6 py-3">
            {error && (
              <p role="alert" className="mr-auto text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="flex gap-2">
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
          </footer>
        </form>
      </AdminModalShell>
    </>
  );
}
