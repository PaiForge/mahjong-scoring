"use client";

import type { ReactNode } from "react";
import { useLinkStatus } from "next/link";
import { useTranslations } from "next-intl";

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
