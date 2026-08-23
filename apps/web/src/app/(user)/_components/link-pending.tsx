"use client";

import type { ReactNode } from "react";
import { useLinkStatus } from "next/link";
import { useTranslations } from "next-intl";

import { BUTTON_CONTENT_CLASSES } from "./_lib/button-classes";

interface LinkPendingProps {
  /** ナビゲーション待機中でないときに表示する内容（チェブロン等）。 */
  readonly children?: ReactNode;
  /** スピナーに付与するクラス（サイズ・色）。 */
  readonly spinnerClassName?: string;
}

/**
 * 親 `<Link>`（next/link）のナビゲーション待機状態を購読し、
 * クリック直後〜遷移完了までスピナーを表示するインジケータ。
 *
 * `<Link>` の子孫としてのみ機能する（`useLinkStatus` の制約）。
 * 待機中はスピナー、それ以外は `children` を描画するため、
 * チェブロンのスロットを差し替える用途にも使える。
 * リンク待機インジケータ
 */
export function LinkPending({
  children,
  spinnerClassName = "",
}: LinkPendingProps) {
  const { pending } = useLinkStatus();
  const t = useTranslations("common");

  if (!pending) return <>{children}</>;

  return (
    <span
      role="status"
      aria-label={t("loading")}
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${spinnerClassName}`}
    />
  );
}

interface LinkPendingOverlayProps {
  /** ボタンの中身（アイコン・ラベル）。 */
  readonly children: ReactNode;
}

/**
 * 親 `<Link>`（next/link）のナビゲーション待機中に、ボタンの中身を隠して
 * 中央にスピナーを重ねるオーバーレイ。
 *
 * ラベルの横にスピナーを足すと文字が押し出されて幅が動くため、
 * 中身は `invisible` で場所だけ残し、その上へ絶対配置で重ねる。
 * 親要素に `relative` が必要（`LinkButton` が付ける）。
 * ボタン中央のリンク待機インジケータ
 */
export function LinkPendingOverlay({ children }: LinkPendingOverlayProps) {
  const { pending } = useLinkStatus();
  const t = useTranslations("common");

  return (
    <>
      <span
        className={`${BUTTON_CONTENT_CLASSES} ${pending ? "invisible" : ""}`}
      >
        {children}
      </span>
      {pending && (
        <span className="absolute inset-0 flex items-center justify-center">
          {/* スピナーの色は border-current 経由でボタンの文字色を継ぐ */}
          <span
            role="status"
            aria-label={t("loading")}
            className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent"
          />
        </span>
      )}
    </>
  );
}
